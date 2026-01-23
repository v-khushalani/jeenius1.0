-- Create profiles for existing auth users
INSERT INTO public.profiles (id, email, full_name, avatar_url)
VALUES 
  ('4adfb1c4-9ff9-463a-bec7-c801770f60cc', 'vkhushalani0001@gmail.com', 'Vishal Khushalani', 'https://lh3.googleusercontent.com/a/ACg8ocLWytGI82RVPiP8LzHkr6elIncPjE7FNY1_lk5hPDtlrqbD0w=s96-c'),
  ('2f40f966-f76d-4743-8da5-f245906fc68a', 'madhvisinghal4@gmail.com', 'Madhvi Singhal', 'https://lh3.googleusercontent.com/a/ACg8ocKXQILSD2pxRaY5yOmFvhgphFXGKG5AYK-tGZFlBKrnb2BtRA=s96-c'),
  ('f0fb31cc-5306-47af-9a2c-aa7096e550c3', 'vk.academy.2020@gmail.com', 'VK''S ACADEMY', 'https://lh3.googleusercontent.com/a/ACg8ocLiDxab0kELbhXYBVS72eMUP1rjOrcDjgqOLvVFSMD_iK904w=s96-c')
ON CONFLICT (id) DO NOTHING;

-- Set Vishal Khushalani as admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('4adfb1c4-9ff9-463a-bec7-c801770f60cc', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;