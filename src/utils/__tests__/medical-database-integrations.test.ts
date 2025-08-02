/**
 * Medical Database Integrations Tests
 * 醫療資料庫整合測試
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  InfermedicaIntegration,
  CanvasMedicalIntegration,
  DrugInteractionIntegration,
  MedicalDatabaseManager,
  medicalDatabaseManager,
  type DiagnosisRequest,
  type DiagnosisEvidence,
  type FHIRPatient
} from '../medical-database-integrations';

// Mock the enhanced API client
vi.mock('../enhanced-api-client', () => ({
  EnhancedApiClient: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }))
}));

// Mock the API key manager
vi.mock('../api-key-manager', () => ({
  apiKeyManager: {
    getKey: vi.fn().mockReturnValue({
      key: 'test-api-key',
      baseURL: 'https://api.test.com',
      metadata: {
        appId: 'test-app-id'
      }
    }),
    getKeyForRequest: vi.fn().mockReturnValue('test-api-key')
  }
}));

describe('InfermedicaIntegration', () => {
  let infermedica: InfermedicaIntegration;
  let mockClient: any;

  beforeEach(() => {
    infermedica = new InfermedicaIntegration();
    mockClient = (infermedica as any).client;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('searchMedicalConcepts', () => {
    it('should search medical concepts successfully', async () => {
      const mockResponse = {
        data: [
          {
            id: 's_21',
            name: 'Headache',
            common_name: 'Head pain',
            type: 'symptom',
            category: 'neurological'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await infermedica.searchMedicalConcepts('headache', 30, 'female');

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/v3/search'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'App-Id': 'test-app-id',
            'App-Key': 'test-api-key',
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result).toEqual([
        {
          id: 's_21',
          name: 'Headache',
          commonName: 'Head pain',
          type: 'symptom',
          category: 'neurological'
        }
      ]);
    });

    it('should handle search errors gracefully', async () => {
      mockClient.get.mockRejectedValue(new Error('API Error'));

      await expect(
        infermedica.searchMedicalConcepts('headache')
      ).rejects.toThrow('無法搜尋醫療概念');
    });
  });

  describe('performDiagnosis', () => {
    it('should perform diagnosis successfully', async () => {
      const mockResponse = {
        data: {
          question: {
            type: 'single',
            text: 'Do you have fever?',
            items: [
              {
                id: 's_98',
                name: 'Fever',
                choices: [
                  { id: 'present', label: 'Yes' },
                  { id: 'absent', label: 'No' }
                ]
              }
            ]
          },
          conditions: [
            {
              id: 'c_49',
              name: 'Common cold',
              common_name: 'Cold',
              probability: 0.85
            }
          ],
          should_stop: false,
          triage: {
            level: 'self_care',
            description: 'Self-care recommended'
          }
        }
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const request: DiagnosisRequest = {
        sex: 'female',
        age: { value: 25 },
        evidence: [
          { id: 's_21', choice_id: 'present', source: 'initial' }
        ]
      };

      const result = await infermedica.performDiagnosis(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/diagnosis',
        request,
        expect.objectContaining({
          headers: expect.objectContaining({
            'App-Id': 'test-app-id',
            'App-Key': 'test-api-key'
          })
        })
      );

      expect(result).toEqual({
        question: mockResponse.data.question,
        conditions: mockResponse.data.conditions,
        should_stop: false,
        triage: mockResponse.data.triage
      });
    });

    it('should handle diagnosis errors', async () => {
      mockClient.post.mockRejectedValue(new Error('Diagnosis failed'));

      const request: DiagnosisRequest = {
        sex: 'male',
        age: { value: 30 },
        evidence: []
      };

      await expect(
        infermedica.performDiagnosis(request)
      ).rejects.toThrow('無法執行診斷分析');
    });
  });

  describe('getTriageRecommendation', () => {
    it('should get triage recommendation successfully', async () => {
      const mockResponse = {
        data: {
          triage_level: 'emergency_ambulance',
          description: 'Call emergency services immediately'
        }
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const request: DiagnosisRequest = {
        sex: 'male',
        age: { value: 55 },
        evidence: [
          { id: 's_29', choice_id: 'present' } // chest pain
        ]
      };

      const result = await infermedica.getTriageRecommendation(request);

      expect(result).toEqual({
        level: 'emergency_ambulance',
        description: 'Call emergency services immediately',
        urgency: 'emergency'
      });
    });

    it('should map urgency levels correctly', async () => {
      const testCases = [
        { triage_level: 'emergency_ambulance', expected: 'emergency' },
        { triage_level: 'consultation_24', expected: 'consultation' },
        { triage_level: 'self_care', expected: 'self_care' }
      ];

      for (const testCase of testCases) {
        mockClient.post.mockResolvedValue({
          data: {
            triage_level: testCase.triage_level,
            description: 'Test description'
          }
        });

        const result = await infermedica.getTriageRecommendation({
          sex: 'female',
          age: { value: 30 },
          evidence: []
        });

        expect(result.urgency).toBe(testCase.expected);
      }
    });
  });

  describe('parseSymptoms', () => {
    it('should parse symptoms from text successfully', async () => {
      const mockResponse = {
        data: {
          mentions: [
            {
              id: 's_21',
              choice_id: 'present'
            },
            {
              id: 's_156',
              choice_id: 'present'
            }
          ]
        }
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const result = await infermedica.parseSymptoms('I have headache and nausea', 30);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/parse',
        {
          text: 'I have headache and nausea',
          age: { value: 30 }
        },
        expect.any(Object)
      );

      expect(result).toEqual([
        { id: 's_21', choice_id: 'present', source: 'initial' },
        { id: 's_156', choice_id: 'present', source: 'initial' }
      ]);
    });
  });

  describe('getSuggestedSymptoms', () => {
    it('should get suggested symptoms successfully', async () => {
      const mockResponse = {
        data: [
          {
            id: 's_98',
            name: 'Fever',
            common_name: 'High temperature',
            type: 'symptom'
          }
        ]
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const request: DiagnosisRequest = {
        sex: 'female',
        age: { value: 25 },
        evidence: [
          { id: 's_21', choice_id: 'present' }
        ]
      };

      const result = await infermedica.getSuggestedSymptoms(request, 5);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/suggest?max_results=5',
        {
          ...request,
          suggest_method: 'symptoms'
        },
        expect.any(Object)
      );

      expect(result).toEqual([
        {
          id: 's_98',
          name: 'Fever',
          commonName: 'High temperature',
          type: 'symptom'
        }
      ]);
    });
  });
});

describe('CanvasMedicalIntegration', () => {
  let canvas: CanvasMedicalIntegration;
  let mockClient: any;

  beforeEach(() => {
    canvas = new CanvasMedicalIntegration();
    mockClient = (canvas as any).client;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('searchPatients', () => {
    it('should search patients successfully', async () => {
      const mockResponse = {
        data: {
          resourceType: 'Bundle',
          entry: [
            {
              resource: {
                resourceType: 'Patient',
                id: 'patient-123',
                name: [
                  {
                    family: 'Doe',
                    given: ['John']
                  }
                ],
                gender: 'male'
              }
            }
          ]
        }
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await canvas.searchPatients({
        name: 'John Doe',
        gender: 'male',
        limit: 10
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/Patient?')
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('patient-123');
      expect(result[0].name[0].family).toBe('Doe');
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        data: {
          resourceType: 'Bundle',
          entry: []
        }
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await canvas.searchPatients({ name: 'NonExistent' });

      expect(result).toEqual([]);
    });
  });

  describe('getPatient', () => {
    it('should get patient by ID successfully', async () => {
      const mockPatient = {
        resourceType: 'Patient',
        id: 'patient-123',
        name: [{ family: 'Doe', given: ['John'] }]
      };

      mockClient.get.mockResolvedValue({ data: mockPatient });

      const result = await canvas.getPatient('patient-123');

      expect(mockClient.get).toHaveBeenCalledWith('/Patient/patient-123');
      expect(result).toEqual(mockPatient);
    });

    it('should return null for non-existent patient', async () => {
      mockClient.get.mockRejectedValue(new Error('Patient not found'));

      const result = await canvas.getPatient('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createPatient', () => {
    it('should create patient successfully', async () => {
      const newPatient: Omit<FHIRPatient, 'id'> = {
        resourceType: 'Patient',
        name: [{ family: 'Smith', given: ['Jane'] }],
        gender: 'female'
      };

      const createdPatient = {
        ...newPatient,
        id: 'patient-456'
      };

      mockClient.post.mockResolvedValue({ data: createdPatient });

      const result = await canvas.createPatient(newPatient);

      expect(mockClient.post).toHaveBeenCalledWith('/Patient', newPatient);
      expect(result).toEqual(createdPatient);
    });
  });

  describe('searchMedications', () => {
    it('should search medications successfully', async () => {
      const mockResponse = {
        data: {
          resourceType: 'Bundle',
          entry: [
            {
              resource: {
                id: 'med-123',
                code: {
                  coding: [
                    {
                      system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                      code: '1191',
                      display: 'Aspirin'
                    }
                  ],
                  text: 'Aspirin 81mg'
                }
              }
            }
          ]
        }
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await canvas.searchMedications({
        text: 'aspirin',
        limit: 5
      });

      expect(result).toHaveLength(1);
      expect(result[0].code.text).toBe('Aspirin 81mg');
    });
  });

  describe('createLabReport', () => {
    it('should create lab report successfully', async () => {
      const mockResponse = {
        data: {
          resourceType: 'DiagnosticReport',
          id: 'report-123',
          status: 'final'
        }
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const labReport = {
        patientId: 'patient-123',
        testName: 'Glucose',
        testCode: '2345-7',
        testSystem: 'http://loinc.org',
        effectiveDateTime: '2024-01-15T10:00:00Z',
        value: 95,
        unit: 'mg/dL',
        referenceRange: {
          low: 70,
          high: 100,
          text: '70-100 mg/dL'
        }
      };

      const result = await canvas.createLabReport(labReport);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/DiagnosticReport/$create-lab-report',
        expect.objectContaining({
          resourceType: 'Parameters',
          parameter: expect.arrayContaining([
            expect.objectContaining({
              name: 'labReport',
              resource: expect.objectContaining({
                resourceType: 'DiagnosticReport',
                status: 'final'
              })
            })
          ])
        })
      );

      expect(result).toEqual(mockResponse.data);
    });
  });
});

describe('DrugInteractionIntegration', () => {
  let drugInteraction: DrugInteractionIntegration;
  let mockClient: any;

  beforeEach(() => {
    drugInteraction = new DrugInteractionIntegration();
    mockClient = (drugInteraction as any).client;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkDrugInteractions', () => {
    it('should check drug interactions successfully', async () => {
      const mockResponse = {
        data: {
          interactions: [
            {
              severity: 'moderate',
              description: 'Increased risk of bleeding',
              mechanism: 'Additive anticoagulant effects',
              management: 'Monitor INR closely'
            }
          ]
        }
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const medications = [
        { name: 'Warfarin', rxcui: '11289' },
        { name: 'Aspirin', rxcui: '1191' }
      ];

      const result = await drugInteraction.checkDrugInteractions(medications);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        drug1: 'Warfarin',
        drug2: 'Aspirin',
        severity: 'moderate',
        description: 'Increased risk of bleeding',
        mechanism: 'Additive anticoagulant effects',
        management: 'Monitor INR closely'
      });
    });

    it('should return empty array for single medication', async () => {
      const medications = [{ name: 'Aspirin' }];

      const result = await drugInteraction.checkDrugInteractions(medications);

      expect(result).toEqual([]);
      expect(mockClient.get).not.toHaveBeenCalled();
    });

    it('should map severity levels correctly', () => {
      const testCases = [
        { input: 'major', expected: 'major' },
        { input: 'severe', expected: 'major' },
        { input: 'moderate', expected: 'moderate' },
        { input: 'minor', expected: 'minor' },
        { input: 'unknown', expected: 'minor' }
      ];

      testCases.forEach(testCase => {
        const result = (drugInteraction as any).mapSeverity(testCase.input);
        expect(result).toBe(testCase.expected);
      });
    });
  });

  describe('getMedicationDetails', () => {
    it('should get medication details by name', async () => {
      const mockResponse = {
        data: {
          name: 'Aspirin',
          rxcui: '1191',
          ingredients: ['Aspirin'],
          dosageForm: 'Tablet',
          strength: '81mg',
          manufacturer: 'Generic'
        }
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await drugInteraction.getMedicationDetails({
        name: 'Aspirin'
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/medication-details?name=Aspirin')
      );

      expect(result).toEqual({
        name: 'Aspirin',
        rxcui: '1191',
        ndc: undefined,
        ingredients: ['Aspirin'],
        dosageForm: 'Tablet',
        strength: '81mg',
        manufacturer: 'Generic'
      });
    });

    it('should handle medication not found', async () => {
      mockClient.get.mockRejectedValue(new Error('Medication not found'));

      const result = await drugInteraction.getMedicationDetails({
        name: 'NonExistentDrug'
      });

      expect(result).toBeNull();
    });

    it('should throw error for missing parameters', async () => {
      await expect(
        drugInteraction.getMedicationDetails({})
      ).rejects.toThrow('需要提供藥物名稱、RxCUI 或 NDC');
    });
  });
});

describe('MedicalDatabaseManager', () => {
  let manager: MedicalDatabaseManager;

  beforeEach(() => {
    manager = new MedicalDatabaseManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstance methods', () => {
    it('should return correct integration instances', () => {
      expect(manager.getInfermedica()).toBeInstanceOf(InfermedicaIntegration);
      expect(manager.getCanvasMedical()).toBeInstanceOf(CanvasMedicalIntegration);
      expect(manager.getDrugInteraction()).toBeInstanceOf(DrugInteractionIntegration);
    });
  });

  describe('performHealthCheck', () => {
    it('should perform health check on all integrations', async () => {
      // Mock successful health checks
      const infermedicaMock = vi.spyOn(manager.getInfermedica(), 'searchMedicalConcepts')
        .mockResolvedValue([]);
      const canvasMock = vi.spyOn(manager.getCanvasMedical(), 'searchPatients')
        .mockResolvedValue([]);
      const drugMock = vi.spyOn(manager.getDrugInteraction(), 'getMedicationDetails')
        .mockResolvedValue(null);

      const result = await manager.performHealthCheck();

      expect(result).toEqual({
        infermedica: true,
        canvasMedical: true,
        drugInteraction: true,
        overall: true
      });

      expect(infermedicaMock).toHaveBeenCalledWith('headache', 30, 'male');
      expect(canvasMock).toHaveBeenCalledWith({ limit: 1 });
      expect(drugMock).toHaveBeenCalledWith({ name: 'aspirin' });
    });

    it('should handle partial failures gracefully', async () => {
      // Mock mixed results
      vi.spyOn(manager.getInfermedica(), 'searchMedicalConcepts')
        .mockResolvedValue([]);
      vi.spyOn(manager.getCanvasMedical(), 'searchPatients')
        .mockRejectedValue(new Error('Canvas API down'));
      vi.spyOn(manager.getDrugInteraction(), 'getMedicationDetails')
        .mockResolvedValue(null);

      const result = await manager.performHealthCheck();

      expect(result).toEqual({
        infermedica: true,
        canvasMedical: false,
        drugInteraction: true,
        overall: true // At least one service is working
      });
    });

    it('should handle complete failure', async () => {
      // Mock all failures
      vi.spyOn(manager.getInfermedica(), 'searchMedicalConcepts')
        .mockRejectedValue(new Error('Infermedica down'));
      vi.spyOn(manager.getCanvasMedical(), 'searchPatients')
        .mockRejectedValue(new Error('Canvas down'));
      vi.spyOn(manager.getDrugInteraction(), 'getMedicationDetails')
        .mockRejectedValue(new Error('Drug API down'));

      const result = await manager.performHealthCheck();

      expect(result).toEqual({
        infermedica: false,
        canvasMedical: false,
        drugInteraction: false,
        overall: false
      });
    });
  });

  describe('getIntegrationStats', () => {
    it('should return integration statistics', () => {
      const stats = manager.getIntegrationStats();

      expect(stats).toEqual({
        infermedica: { available: true },
        canvasMedical: { available: true },
        drugInteraction: { available: true }
      });
    });
  });
});

describe('medicalDatabaseManager singleton', () => {
  it('should export a singleton instance', () => {
    expect(medicalDatabaseManager).toBeInstanceOf(MedicalDatabaseManager);
  });

  it('should return the same instance on multiple imports', () => {
    const manager1 = medicalDatabaseManager;
    const manager2 = medicalDatabaseManager;

    expect(manager1).toBe(manager2);
  });
});

describe('Error handling', () => {
  it('should handle network errors gracefully', async () => {
    const infermedica = new InfermedicaIntegration();
    const mockClient = (infermedica as any).client;

    mockClient.get.mockRejectedValue(new Error('Network error'));

    await expect(
      infermedica.searchMedicalConcepts('test')
    ).rejects.toThrow('無法搜尋醫療概念');
  });

  it('should handle API rate limiting', async () => {
    const canvas = new CanvasMedicalIntegration();
    const mockClient = (canvas as any).client;

    const rateLimitError = new Error('Rate limit exceeded');
    (rateLimitError as any).response = { status: 429 };
    
    mockClient.get.mockRejectedValue(rateLimitError);

    await expect(
      canvas.searchPatients({ name: 'test' })
    ).rejects.toThrow('無法搜尋患者記錄');
  });

  it('should handle authentication errors', async () => {
    const drugInteraction = new DrugInteractionIntegration();
    const mockClient = (drugInteraction as any).client;

    const authError = new Error('Unauthorized');
    (authError as any).response = { status: 401 };
    
    mockClient.get.mockRejectedValue(authError);

    const result = await drugInteraction.getMedicationDetails({
      name: 'test'
    });

    expect(result).toBeNull();
  });
});

describe('Integration with API Key Manager', () => {
  it('should use correct API keys for different services', () => {
    const { apiKeyManager } = require('../api-key-manager');

    // Test that each integration requests the correct API key
    new InfermedicaIntegration();
    expect(apiKeyManager.getKey).toHaveBeenCalledWith('infermedica-api');

    new CanvasMedicalIntegration();
    expect(apiKeyManager.getKey).toHaveBeenCalledWith('canvas-medical-api');

    new DrugInteractionIntegration();
    expect(apiKeyManager.getKey).toHaveBeenCalledWith('drug-interaction-api');
  });

  it('should throw error when API key is not configured', () => {
    const { apiKeyManager } = require('../api-key-manager');
    
    apiKeyManager.getKey.mockReturnValue(null);

    expect(() => {
      new InfermedicaIntegration();
    }).toThrow('Infermedica API 金鑰未配置');
  });
});