// server/src/controllers/mainController.ts
import { Request, Response } from 'express';
import { USERS } from '../models/mockData';

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = USERS.find(u => u.username === username && u.password === password);

  if (user) {
    const responseData = {
      token: "mock-jwt-token-" + user.id, 
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        avatarUrl: user.avatarUrl || "" // <--- THÊM DÒNG NÀY
      }
    };
    return res.status(200).json({ success: true, data: responseData });
  } else {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
};