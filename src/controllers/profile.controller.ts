import { completeOnboarding } from "../modules/profile/profile.service";

export const completeOnboardingController = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const result = await completeOnboarding(userId, req.body);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};