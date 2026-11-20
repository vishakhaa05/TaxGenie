import {
  findBusinessProfileByUserId,
  upsertBusinessProfile,
} from "../utils/localStore";

export class BusinessProfileService {
  public static async getProfile(userId: string) {
    const profile = await findBusinessProfileByUserId(userId);
    return profile || null;
  }

  public static async saveProfile(userId: string, data: any) {
    return await upsertBusinessProfile(userId, data);
  }
}
