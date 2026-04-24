import { Request, Response } from 'express';
import { completeOnboarding, getMyProfile, updateProfile } from "../modules/profile/profile.service";

export const completeOnboardingController = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const result = await completeOnboarding(userId, req.body);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyProfileController = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    console.log('userId:', userId);
    const profile = await getMyProfile(userId);

    res.json(profile);
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

export const updateProfileController = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    console.log('userId:', userId);
    const profile = await updateProfile(userId, req.body);

    res.json(profile);
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};