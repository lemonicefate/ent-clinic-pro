# ENT Clinic Pro - Project Overview

## Purpose
ENT Clinic Pro is a modern medical platform built with Astro, specifically designed for ENT (Ear, Nose, Throat) medical professionals. It provides modular, scalable medical calculation tools and educational content management system.

## Key Features
- **Modular Calculator System**: Independent calculator modules (BMI, CHA₂DS₂-VASc, eGFR) that are easy to develop and maintain
- **Multi-language Support**: Supports Traditional Chinese (zh-TW), English (en), and Japanese (ja)
- **Responsive Design**: Works across desktop, tablet, and mobile devices
- **Rich Visualizations**: Charts and visual components for medical data
- **Complete Testing**: Unit tests, integration tests, and end-to-end tests
- **Accessibility Support**: WCAG compliant
- **Security**: Strict input validation and error handling

## Current Status
The project is implementing a unified calculator architecture to replace the old system. Most core calculators (BMI, CHA₂DS₂-VASc, eGFR) have been migrated to the new modular system.

## Deployment
- **Production**: https://ent-clinic-pro.pages.dev
- **Platform**: Cloudflare Pages (Static Site Generation)
- **Build Time**: ~24 seconds
- **Total Pages**: 51 pages
- **Auto Deploy**: Triggered on master branch push