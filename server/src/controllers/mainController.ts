// server/src/controllers/mainController.ts
import { Request, Response } from 'express';
import { USERS, User } from '../models/mockData';

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Tìm user trong Mock Database
  const user = USERS.find(u => u.username === username && u.password === password);

  if (user) {
    // Giả lập trả về token và thông tin user
    // Trong thực tế sẽ dùng JWT để tạo token
    const responseData = {
      token: "mock-jwt-token-" + user.id, 
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        email: user.email
      }
    };
    return res.status(200).json({ success: true, data: responseData });
  } else {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
};
