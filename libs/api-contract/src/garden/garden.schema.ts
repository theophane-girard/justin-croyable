import { z } from 'zod';

export const GARDEN_ROLE = {
  owner: 'owner',
  coOwner: 'co_owner',
  tempEditorViewer: 'temp_editor_viewer',
  tempEditorRevoked: 'temp_editor_revoked',
  viewer: 'viewer',
} as const;

export type GardenRole = (typeof GARDEN_ROLE)[keyof typeof GARDEN_ROLE];

export const gardenRoleSchema = z.enum([
  GARDEN_ROLE.owner,
  GARDEN_ROLE.coOwner,
  GARDEN_ROLE.tempEditorViewer,
  GARDEN_ROLE.tempEditorRevoked,
  GARDEN_ROLE.viewer,
]);

export const gardenSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  role: gardenRoleSchema,
  createdAt: z.string().datetime(),
});

export type Garden = z.infer<typeof gardenSchema>;

export const gardenMemberSchema = z.object({
  id: z.string().uuid(),
  gardenId: z.string().uuid(),
  email: z.string().email(),
  userId: z.string().uuid().nullable(),
  role: gardenRoleSchema,
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type GardenMember = z.infer<typeof gardenMemberSchema>;

export const shareableRoleSchema = z.enum([GARDEN_ROLE.coOwner, GARDEN_ROLE.viewer]);

export type ShareableRole = z.infer<typeof shareableRoleSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: shareableRoleSchema,
});

export type InviteMemberPayload = z.infer<typeof inviteMemberSchema>;

export const updateMemberSchema = z.object({
  role: shareableRoleSchema,
});

export type UpdateMemberPayload = z.infer<typeof updateMemberSchema>;

export const gardenMemberParamsSchema = z.object({
  id: z.string().uuid(),
  memberId: z.string().uuid(),
});
