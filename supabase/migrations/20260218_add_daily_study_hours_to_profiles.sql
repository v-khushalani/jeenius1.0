-- Migration: Add daily_study_hours column to profiles table
ALTER TABLE public.profiles ADD COLUMN daily_study_hours integer;
