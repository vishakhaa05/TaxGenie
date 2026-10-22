import { NotFoundException } from "../utils/app-error";
import { UpdateUserType } from "../validators/user.validator";
import { findUserById, updateUserRecord } from "../utils/userStore";

export const findByIdUserService = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) return null;
  return typeof user.omitPassword === "function" ? user.omitPassword() : user;
};

export const updateUserService = async (
  userId: string,
  body: UpdateUserType,
  profilePic?: Express.Multer.File
) => {
  const updateData: { name?: string | undefined; profilePicture?: string | undefined } = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (profilePic?.path !== undefined) updateData.profilePicture = profilePic.path;

  const updated = await updateUserRecord(userId, updateData);

  if (!updated) throw new NotFoundException("User not found");
  return typeof updated.omitPassword === "function"
    ? updated.omitPassword()
    : updated;
};
