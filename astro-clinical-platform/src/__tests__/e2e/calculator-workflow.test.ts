/**
 * 端到端計算器工作流程測試
 * 測試從載入模組到計算結果的完整流程
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AstroCalculatorService } from '../../services/CalculatorService';
import { CalculatorEngine, createCalculatorEngine } from '../../utils/calculator-engine';
import { CalculatorRegistry, creat