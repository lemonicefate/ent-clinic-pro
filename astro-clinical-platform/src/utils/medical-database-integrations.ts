/**
 * Medical Database Integrations
 * 整合外部醫療數據庫和 API，包含症狀檢查、藥物交互作用和 FHIR 資源
 */

import { EnhancedApiClient } from './enhanced-api-client';
import { apiKeyManager } from './api-key-manager';

// 類型定義
export interface MedicalSymptom {
  id: string;
  name: string;
  commonName?: string;
  type: 'symptom' | 'risk_factor';
  category?: string;
}

export interface DiagnosisEvidence {
  id: string;
  choice_id: 'present' | 'absent' | 'unknown';
  source?: 'initial' | 'predefined' | 'suggest';
}

export interface DiagnosisRequest {
  sex: 'male' | 'female';
  age: {
    value: number;
    unit?: 'year' | 'month';
  };
  evidence: DiagnosisEvidence[];
}

export interface DiagnosisResponse {
  question?: {
    type: string;
    text: string;
    items?: Array<{
      id: string;
      name: string;
      choices: Array<{
        id: string;
        label: string;
      }>;
    }>;
  };
  conditions?: Array<{
    id: string;
    name: string;
    common_name: string;
    probability: number;
  }>;
  should_stop: boolean;
  triage?: {
    level: string;
    description: string;
  };
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  mechanism?: string;
  management?: string;
}

export interface FHIRPatient {
  resourceType: 'Patient';
  id?: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name?: Array<{
    family: string;
    given: string[];
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
  }>;
}

export interface FHIRObservation {
  resourceType: 'Observation';
  id?: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string;
    type: 'Patient';
  };
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  component?: Array<{
    code: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    valueQuantity: {
      value: number;
      unit: string;
    };
  }>;
}/
**
 * Infermedica API 整合類
 * 提供症狀檢查、診斷建議和醫療概念搜尋功能
 */
export class InfermedicaIntegration {
  private client: EnhancedApiClient;
  private appId: string;
  private appKey: string;

  constructor() {
    // 初始化 API 客戶端
    this.client = new EnhancedApiClient({
      keyName: 'infermedica-api',
      timeout: 20000,
      retries: 3,
      enableCache: true,
      cacheTTL: 300000, // 5 分鐘快取
      enableCircuitBreaker: true
    });

    // 從 API 金鑰管理器獲取認證資訊
    const keyConfig = apiKeyManager.getKey('infermedica-api');
    if (!keyConfig) {
      throw new Error('Infermedica API 金鑰未配置');
    }

    this.appId = keyConfig.metadata?.appId || '';
    this.appKey = keyConfig.key;
  }

  /**
   * 生成面談 ID
   */
  private generateInterviewId(): string {
    return `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 獲取通用請求標頭
   */
  private getHeaders(interviewId?: string) {
    return {
      'App-Id': this.appId,
      'App-Key': this.appKey,
      'Interview-Id': interviewId || this.generateInterviewId(),
      'Content-Type': 'application/json'
    };
  }

  /**
   * 搜尋醫療概念（症狀、疾病等）
   */
  async searchMedicalConcepts(
    phrase: string, 
    age?: number, 
    sex?: 'male' | 'female'
  ): Promise<MedicalSymptom[]> {
    try {
      const params = new URLSearchParams({
        phrase,
        ...(age && { 'age.value': age.toString() }),
        ...(sex && { sex })
      });

      const response = await this.client.get(`/v3/search?${params}`, {
        headers: this.getHeaders()
      });

      return response.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        commonName: item.common_name,
        type: item.type,
        category: item.category
      }));
    } catch (error) {
      console.error('搜尋醫療概念失敗:', error);
      throw new Error('無法搜尋醫療概念');
    }
  }

  /**
   * 執行症狀診斷分析
   */
  async performDiagnosis(request: DiagnosisRequest): Promise<DiagnosisResponse> {
    try {
      const response = await this.client.post('/v3/diagnosis', request, {
        headers: this.getHeaders()
      });

      return {
        question: response.data.question,
        conditions: response.data.conditions,
        should_stop: response.data.should_stop,
        triage: response.data.triage
      };
    } catch (error) {
      console.error('診斷分析失敗:', error);
      throw new Error('無法執行診斷分析');
    }
  }

  /**
   * 獲取分診建議
   */
  async getTriageRecommendation(request: DiagnosisRequest): Promise<{
    level: string;
    description: string;
    urgency: 'emergency' | 'consultation' | 'self_care';
  }> {
    try {
      const response = await this.client.post('/v3/triage', request, {
        headers: this.getHeaders()
      });

      const triageLevel = response.data.triage_level;
      let urgency: 'emergency' | 'consultation' | 'self_care' = 'self_care';

      if (triageLevel.includes('emergency')) {
        urgency = 'emergency';
      } else if (triageLevel.includes('consultation')) {
        urgency = 'consultation';
      }

      return {
        level: triageLevel,
        description: response.data.description || '',
        urgency
      };
    } catch (error) {
      console.error('分診建議獲取失敗:', error);
      throw new Error('無法獲取分診建議');
    }
  }

  /**
   * 解析自然語言症狀描述
   */
  async parseSymptoms(text: string, age: number): Promise<DiagnosisEvidence[]> {
    try {
      const response = await this.client.post('/v3/parse', {
        text,
        age: { value: age }
      }, {
        headers: this.getHeaders()
      });

      return response.data.mentions.map((mention: any) => ({
        id: mention.id,
        choice_id: mention.choice_id,
        source: 'initial'
      }));
    } catch (error) {
      console.error('症狀解析失敗:', error);
      throw new Error('無法解析症狀描述');
    }
  }

  /**
   * 獲取相關症狀建議
   */
  async getSuggestedSymptoms(
    request: DiagnosisRequest,
    maxResults: number = 10
  ): Promise<MedicalSymptom[]> {
    try {
      const response = await this.client.post(`/v3/suggest?max_results=${maxResults}`, {
        ...request,
        suggest_method: 'symptoms'
      }, {
        headers: this.getHeaders()
      });

      return response.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        commonName: item.common_name,
        type: item.type
      }));
    } catch (error) {
      console.error('症狀建議獲取失敗:', error);
      throw new Error('無法獲取症狀建議');
    }
  }
}

/**
 * Canvas Medical FHIR API 整合類
 * 提供電子健康記錄 (EHR) 整合功能
 */
export class CanvasMedicalIntegration {
  private client: EnhancedApiClient;

  constructor() {
    // 初始化 API 客戶端
    this.client = new EnhancedApiClient({
      keyName: 'canvas-medical-api',
      timeout: 30000,
      retries: 2,
      enableCache: true,
      cacheTTL: 600000, // 10 分鐘快取
      enableCircuitBreaker: true,
      rateLimit: {
        requests: 100,
        window: 60000
      }
    });
  }

  /**
   * 搜尋患者記錄
   */
  async searchPatients(params: {
    name?: string;
    identifier?: string;
    birthdate?: string;
    gender?: 'male' | 'female';
    limit?: number;
  }): Promise<FHIRPatient[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.name) searchParams.append('name', params.name);
      if (params.identifier) searchParams.append('identifier', params.identifier);
      if (params.birthdate) searchParams.append('birthdate', params.birthdate);
      if (params.gender) searchParams.append('gender', params.gender);
      if (params.limit) searchParams.append('_count', params.limit.toString());

      const response = await this.client.get(`/Patient?${searchParams}`);
      
      if (response.data.resourceType === 'Bundle' && response.data.entry) {
        return response.data.entry.map((entry: any) => entry.resource);
      }
      
      return [];
    } catch (error) {
      console.error('患者搜尋失敗:', error);
      throw new Error('無法搜尋患者記錄');
    }
  }

  /**
   * 獲取患者詳細資訊
   */
  async getPatient(patientId: string): Promise<FHIRPatient | null> {
    try {
      const response = await this.client.get(`/Patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('獲取患者資訊失敗:', error);
      return null;
    }
  }

  /**
   * 創建新患者記錄
   */
  async createPatient(patient: Omit<FHIRPatient, 'id'>): Promise<FHIRPatient> {
    try {
      const response = await this.client.post('/Patient', patient);
      return response.data;
    } catch (error) {
      console.error('創建患者記錄失敗:', error);
      throw new Error('無法創建患者記錄');
    }
  }

  /**
   * 更新患者記錄
   */
  async updatePatient(patientId: string, patient: FHIRPatient): Promise<FHIRPatient> {
    try {
      const response = await this.client.put(`/Patient/${patientId}`, patient);
      return response.data;
    } catch (error) {
      console.error('更新患者記錄失敗:', error);
      throw new Error('無法更新患者記錄');
    }
  }

  /**
   * 搜尋藥物資訊
   */
  async searchMedications(params: {
    code?: string;
    text?: string;
    limit?: number;
  }): Promise<Array<{
    id: string;
    code: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text: string;
    };
  }>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.code) searchParams.append('code', params.code);
      if (params.text) searchParams.append('_text', params.text);
      if (params.limit) searchParams.append('_count', params.limit.toString());

      const response = await this.client.get(`/Medication?${searchParams}`);
      
      if (response.data.resourceType === 'Bundle' && response.data.entry) {
        return response.data.entry.map((entry: any) => entry.resource);
      }
      
      return [];
    } catch (error) {
      console.error('藥物搜尋失敗:', error);
      throw new Error('無法搜尋藥物資訊');
    }
  }

  /**
   * 獲取患者的藥物記錄
   */
  async getPatientMedications(patientId: string): Promise<Array<{
    id: string;
    status: string;
    medicationReference?: {
      reference: string;
      display: string;
    };
    subject: {
      reference: string;
    };
    effectivePeriod?: {
      start?: string;
      end?: string;
    };
  }>> {
    try {
      const response = await this.client.get(`/MedicationStatement?subject=Patient/${patientId}`);
      
      if (response.data.resourceType === 'Bundle' && response.data.entry) {
        return response.data.entry.map((entry: any) => entry.resource);
      }
      
      return [];
    } catch (error) {
      console.error('獲取患者藥物記錄失敗:', error);
      throw new Error('無法獲取患者藥物記錄');
    }
  }

  /**
   * 創建觀察記錄（檢驗結果、生命徵象等）
   */
  async createObservation(observation: Omit<FHIRObservation, 'id'>): Promise<FHIRObservation> {
    try {
      const response = await this.client.post('/Observation', observation);
      return response.data;
    } catch (error) {
      console.error('創建觀察記錄失敗:', error);
      throw new Error('無法創建觀察記錄');
    }
  }

  /**
   * 獲取患者的觀察記錄
   */
  async getPatientObservations(
    patientId: string,
    category?: string,
    code?: string
  ): Promise<FHIRObservation[]> {
    try {
      const searchParams = new URLSearchParams({
        subject: `Patient/${patientId}`
      });
      
      if (category) searchParams.append('category', category);
      if (code) searchParams.append('code', code);

      const response = await this.client.get(`/Observation?${searchParams}`);
      
      if (response.data.resourceType === 'Bundle' && response.data.entry) {
        return response.data.entry.map((entry: any) => entry.resource);
      }
      
      return [];
    } catch (error) {
      console.error('獲取患者觀察記錄失敗:', error);
      throw new Error('無法獲取患者觀察記錄');
    }
  }

  /**
   * 創建診斷報告
   */
  async createDiagnosticReport(report: {
    status: 'final' | 'preliminary' | 'registered';
    category: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    }>;
    subject: {
      reference: string;
      type: 'Patient';
    };
    effectiveDateTime: string;
    result?: Array<{
      reference: string;
    }>;
    conclusion?: string;
  }): Promise<any> {
    try {
      const diagnosticReport = {
        resourceType: 'DiagnosticReport',
        ...report
      };

      const response = await this.client.post('/DiagnosticReport', diagnosticReport);
      return response.data;
    } catch (error) {
      console.error('創建診斷報告失敗:', error);
      throw new Error('無法創建診斷報告');
    }
  }

  /**
   * 使用 Canvas Medical 的 $create-lab-report 操作
   */
  async createLabReport(labReport: {
    patientId: string;
    testName: string;
    testCode: string;
    testSystem: string;
    effectiveDateTime: string;
    value: number;
    unit: string;
    referenceRange?: {
      low: number;
      high: number;
      text: string;
    };
  }): Promise<any> {
    try {
      const parameters = {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'labReport',
            resource: {
              resourceType: 'DiagnosticReport',
              status: 'final',
              category: [
                {
                  coding: [
                    {
                      system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
                      code: 'LAB',
                      display: 'Laboratory'
                    }
                  ]
                }
              ],
              subject: {
                reference: `Patient/${labReport.patientId}`,
                type: 'Patient'
              },
              presentedForm: [
                {
                  code: {
                    text: labReport.testName,
                    coding: [
                      {
                        system: labReport.testSystem,
                        code: labReport.testCode,
                        display: labReport.testName
                      }
                    ]
                  },
                  effectiveDateTime: labReport.effectiveDateTime,
                  valueQuantity: {
                    unit: labReport.unit,
                    value: labReport.value,
                    system: 'http://unitsofmeasure.org'
                  },
                  ...(labReport.referenceRange && {
                    referenceRange: [
                      {
                        low: { value: labReport.referenceRange.low },
                        high: { value: labReport.referenceRange.high },
                        text: labReport.referenceRange.text
                      }
                    ]
                  })
                }
              ]
            }
          }
        ]
      };

      const response = await this.client.post('/DiagnosticReport/$create-lab-report', parameters);
      return response.data;
    } catch (error) {
      console.error('創建實驗室報告失敗:', error);
      throw new Error('無法創建實驗室報告');
    }
  }
}

/**
 * 藥物交互作用檢查整合
 * 整合多個藥物資料庫進行交互作用檢查
 */
export class DrugInteractionIntegration {
  private client: EnhancedApiClient;

  constructor() {
    this.client = new EnhancedApiClient({
      keyName: 'drug-interaction-api',
      timeout: 15000,
      retries: 2,
      enableCache: true,
      cacheTTL: 3600000, // 1 小時快取
      enableCircuitBreaker: true
    });
  }

  /**
   * 檢查藥物交互作用
   */
  async checkDrugInteractions(medications: Array<{
    name: string;
    rxcui?: string;
    ndc?: string;
  }>): Promise<DrugInteraction[]> {
    try {
      if (medications.length < 2) {
        return [];
      }

      const interactions: DrugInteraction[] = [];

      // 檢查每對藥物的交互作用
      for (let i = 0; i < medications.length; i++) {
        for (let j = i + 1; j < medications.length; j++) {
          const drug1 = medications[i];
          const drug2 = medications[j];

          try {
            const interaction = await this.checkPairInteraction(drug1, drug2);
            if (interaction) {
              interactions.push(interaction);
            }
          } catch (error) {
            console.warn(`檢查 ${drug1.name} 與 ${drug2.name} 交互作用失敗:`, error);
          }
        }
      }

      return interactions;
    } catch (error) {
      console.error('藥物交互作用檢查失敗:', error);
      throw new Error('無法檢查藥物交互作用');
    }
  }

  /**
   * 檢查兩個藥物之間的交互作用
   */
  private async checkPairInteraction(
    drug1: { name: string; rxcui?: string; ndc?: string },
    drug2: { name: string; rxcui?: string; ndc?: string }
  ): Promise<DrugInteraction | null> {
    try {
      // 使用 RxNorm API 檢查交互作用
      const params = new URLSearchParams();
      
      if (drug1.rxcui && drug2.rxcui) {
        params.append('rxcui1', drug1.rxcui);
        params.append('rxcui2', drug2.rxcui);
      } else {
        // 如果沒有 RxCUI，使用藥物名稱搜尋
        params.append('drug1', drug1.name);
        params.append('drug2', drug2.name);
      }

      const response = await this.client.get(`/interaction?${params}`);

      if (response.data && response.data.interactions && response.data.interactions.length > 0) {
        const interaction = response.data.interactions[0];
        
        return {
          drug1: drug1.name,
          drug2: drug2.name,
          severity: this.mapSeverity(interaction.severity),
          description: interaction.description || '發現藥物交互作用',
          mechanism: interaction.mechanism,
          management: interaction.management
        };
      }

      return null;
    } catch (error) {
      console.error('檢查藥物對交互作用失敗:', error);
      return null;
    }
  }

  /**
   * 映射嚴重程度
   */
  private mapSeverity(severity: string): 'minor' | 'moderate' | 'major' {
    const severityLower = severity?.toLowerCase() || '';
    
    if (severityLower.includes('major') || severityLower.includes('severe')) {
      return 'major';
    } else if (severityLower.includes('moderate')) {
      return 'moderate';
    } else {
      return 'minor';
    }
  }

  /**
   * 獲取藥物詳細資訊
   */
  async getMedicationDetails(medication: {
    name?: string;
    rxcui?: string;
    ndc?: string;
  }): Promise<{
    name: string;
    rxcui?: string;
    ndc?: string;
    ingredients: string[];
    dosageForm?: string;
    strength?: string;
    manufacturer?: string;
  } | null> {
    try {
      const params = new URLSearchParams();
      
      if (medication.rxcui) {
        params.append('rxcui', medication.rxcui);
      } else if (medication.ndc) {
        params.append('ndc', medication.ndc);
      } else if (medication.name) {
        params.append('name', medication.name);
      } else {
        throw new Error('需要提供藥物名稱、RxCUI 或 NDC');
      }

      const response = await this.client.get(`/medication-details?${params}`);

      if (response.data) {
        return {
          name: response.data.name,
          rxcui: response.data.rxcui,
          ndc: response.data.ndc,
          ingredients: response.data.ingredients || [],
          dosageForm: response.data.dosageForm,
          strength: response.data.strength,
          manufacturer: response.data.manufacturer
        };
      }

      return null;
    } catch (error) {
      console.error('獲取藥物詳細資訊失敗:', error);
      return null;
    }
  }
}

/**
 * 醫療資料庫整合管理器
 * 統一管理所有醫療資料庫整合
 */
export class MedicalDatabaseManager {
  private infermedica: InfermedicaIntegration;
  private canvasMedical: CanvasMedicalIntegration;
  private drugInteraction: DrugInteractionIntegration;

  constructor() {
    this.infermedica = new InfermedicaIntegration();
    this.canvasMedical = new CanvasMedicalIntegration();
    this.drugInteraction = new DrugInteractionIntegration();
  }

  /**
   * 獲取 Infermedica 整合實例
   */
  getInfermedica(): InfermedicaIntegration {
    return this.infermedica;
  }

  /**
   * 獲取 Canvas Medical 整合實例
   */
  getCanvasMedical(): CanvasMedicalIntegration {
    return this.canvasMedical;
  }

  /**
   * 獲取藥物交互作用整合實例
   */
  getDrugInteraction(): DrugInteractionIntegration {
    return this.drugInteraction;
  }

  /**
   * 執行綜合健康檢查
   */
  async performHealthCheck(): Promise<{
    infermedica: boolean;
    canvasMedical: boolean;
    drugInteraction: boolean;
    overall: boolean;
  }> {
    const results = {
      infermedica: false,
      canvasMedical: false,
      drugInteraction: false,
      overall: false
    };

    try {
      // 檢查 Infermedica API
      try {
        await this.infermedica.searchMedicalConcepts('headache', 30, 'male');
        results.infermedica = true;
      } catch (error) {
        console.warn('Infermedica 健康檢查失敗:', error);
      }

      // 檢查 Canvas Medical API
      try {
        await this.canvasMedical.searchPatients({ limit: 1 });
        results.canvasMedical = true;
      } catch (error) {
        console.warn('Canvas Medical 健康檢查失敗:', error);
      }

      // 檢查藥物交互作用 API
      try {
        await this.drugInteraction.getMedicationDetails({ name: 'aspirin' });
        results.drugInteraction = true;
      } catch (error) {
        console.warn('藥物交互作用 API 健康檢查失敗:', error);
      }

      results.overall = results.infermedica || results.canvasMedical || results.drugInteraction;
    } catch (error) {
      console.error('醫療資料庫健康檢查失敗:', error);
    }

    return results;
  }

  /**
   * 獲取所有整合的統計資訊
   */
  getIntegrationStats() {
    return {
      infermedica: {
        // Infermedica 統計資訊將在實際實現中添加
        available: true
      },
      canvasMedical: {
        // Canvas Medical 統計資訊將在實際實現中添加
        available: true
      },
      drugInteraction: {
        // 藥物交互作用統計資訊將在實際實現中添加
        available: true
      }
    };
  }
}

// 導出單例實例
export const medicalDatabaseManager = new MedicalDatabaseManager();