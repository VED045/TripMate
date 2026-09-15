-- Migration: 005_whatsapp_group.sql
-- Add whatsapp_link column to trips table

ALTER TABLE trips ADD COLUMN IF NOT EXISTS whatsapp_link TEXT;
