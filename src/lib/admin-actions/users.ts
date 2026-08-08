'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import {
  ApiError,
  assertSuperAdminFloorAfterRemovingTarget,
  requireSuperAdmin,
  requireUser,
} from '@/lib/auth-server';
import {
  changeOwnPasswordSchema,
  changeRoleSchema,
  resetPasswordSchema,
  userCreateSchema,
  userUpdateSchema,
} from '@/lib/validation';

const BCRYPT_ROUNDS = 12;

export type ActionResult = { ok: true } | { ok: false; error: string };

function getStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

async function gateSuperAdmin(): Promise<ActionResult | null> {
  try {
    await requireSuperAdmin();
    return null;
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.publicMessage };
    return { ok: false, error: 'Authorization check failed' };
  }
}

async function gateUser(): Promise<ActionResult | null> {
  try {
    await requireUser();
    return null;
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.publicMessage };
    return { ok: false, error: 'Authentication required' };
  }
}

function zodErr(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): string {
  return issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
}

// ─────────────────────────────────────────────────────────────────
//  CREATE
// ─────────────────────────────────────────────────────────────────
export async function createUserAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await gateSuperAdmin();
  if (denied) return denied;

  const raw = {
    email:    getStr(formData, 'email'),
    name:     getStr(formData, 'name'),
    password: getStr(formData, 'password'),
    role:     getStr(formData, 'role') as 'super_admin' | 'admin',
  };

  const parsed = userCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: zodErr(parsed.error.issues) };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: 'A user with this email already exists' };

  const hash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      role: parsed.data.role,
      isActive: true,
    },
  });
  await prisma.account.create({
    data: {
      userId: user.id,
      providerId: 'credential',
      accountId: user.id,
      password: hash,
    },
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin');
  redirect('/admin/users');
}

// ─────────────────────────────────────────────────────────────────
//  UPDATE (name + role + isActive)
//    Safety: blocks if change would remove the last active super_admin.
//    Deactivation also revokes the target's sessions.
// ─────────────────────────────────────────────────────────────────
export async function updateUserAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await gateSuperAdmin();
  if (denied) return denied;

  // Checkbox handling: <input type="checkbox" name="isActive"/> sends
  // "on" when checked, nothing when unchecked.
  const raw = {
    name:     getStr(formData, 'name'),
    role:     getStr(formData, 'role') as 'super_admin' | 'admin',
    isActive: formData.get('isActive') === 'on',
  };

  const parsed = userUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: zodErr(parsed.error.issues) };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, isActive: true },
  });
  if (!target) return { ok: false, error: 'User not found' };

  const wasActiveSuper = target.role === 'super_admin' && target.isActive;
  const willBeSuper =
    parsed.data.role !== undefined ? parsed.data.role === 'super_admin' : target.role === 'super_admin';
  const willBeActive =
    parsed.data.isActive !== undefined ? parsed.data.isActive : target.isActive;
  const willBeActiveSuper = willBeSuper && willBeActive;

  if (wasActiveSuper && !willBeActiveSuper) {
    try {
      await assertSuperAdminFloorAfterRemovingTarget(id);
    } catch (e) {
      return {
        ok: false,
        error: e instanceof ApiError ? e.publicMessage : 'Safety check failed',
      };
    }
  }

  await prisma.user.update({ where: { id }, data: parsed.data });

  if (target.isActive && parsed.data.isActive === false) {
    await prisma.session.deleteMany({ where: { userId: id } });
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}`);
  revalidatePath('/admin');
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  DELETE
// ─────────────────────────────────────────────────────────────────
export async function deleteUserAction(id: string): Promise<ActionResult> {
  const denied = await gateSuperAdmin();
  if (denied) return denied;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, isActive: true },
  });
  if (!target) return { ok: false, error: 'User not found' };

  if (target.role === 'super_admin' && target.isActive) {
    try {
      await assertSuperAdminFloorAfterRemovingTarget(id);
    } catch (e) {
      return {
        ok: false,
        error: e instanceof ApiError ? e.publicMessage : 'Safety check failed',
      };
    }
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/users');
  revalidatePath('/admin');
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  RESET PASSWORD (super_admin → target)
//    Writes new bcrypt hash AND revokes all of the target's sessions.
// ─────────────────────────────────────────────────────────────────
export async function resetPasswordAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await gateSuperAdmin();
  if (denied) return denied;

  const raw = { newPassword: getStr(formData, 'newPassword') };
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: zodErr(parsed.error.issues) };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      accounts: { where: { providerId: 'credential' }, select: { id: true } },
    },
  });
  if (!target) return { ok: false, error: 'User not found' };
  if (target.accounts.length === 0) {
    return { ok: false, error: 'User has no credential account' };
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.account.update({
      where: { id: target.accounts[0].id },
      data: { password: hash },
    }),
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);

  revalidatePath(`/admin/users/${id}`);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  CHANGE ROLE (super_admin → target)
//    Mirrors UPDATE's safety rule for demotion.
// ─────────────────────────────────────────────────────────────────
export async function changeRoleAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await gateSuperAdmin();
  if (denied) return denied;

  const raw = { role: getStr(formData, 'role') as 'super_admin' | 'admin' };
  const parsed = changeRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: zodErr(parsed.error.issues) };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, isActive: true },
  });
  if (!target) return { ok: false, error: 'User not found' };

  const wasActiveSuper = target.role === 'super_admin' && target.isActive;
  const willBeSuper = parsed.data.role === 'super_admin';

  if (wasActiveSuper && !willBeSuper) {
    try {
      await assertSuperAdminFloorAfterRemovingTarget(id);
    } catch (e) {
      return {
        ok: false,
        error: e instanceof ApiError ? e.publicMessage : 'Safety check failed',
      };
    }
  }

  await prisma.user.update({ where: { id }, data: { role: parsed.data.role } });
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}`);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  CHANGE OWN PASSWORD (any authenticated admin)
//    Routes through Better Auth's auth.api.changePassword which
//    verifies the current password and updates Account.password.
// ─────────────────────────────────────────────────────────────────
export async function changeOwnPasswordAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await gateUser();
  if (denied) return denied;

  const raw = {
    currentPassword: getStr(formData, 'currentPassword'),
    newPassword:     getStr(formData, 'newPassword'),
  };
  const confirmPassword = getStr(formData, 'confirmPassword');

  if (raw.newPassword !== confirmPassword) {
    return { ok: false, error: 'New password and confirmation do not match' };
  }

  const parsed = changeOwnPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: zodErr(parsed.error.issues) };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword:     parsed.data.newPassword,
      },
      headers: await headers(),
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to change password';
    // Better Auth surfaces "Invalid password" for wrong current password.
    return { ok: false, error: msg };
  }
}
