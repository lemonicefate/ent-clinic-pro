/**
 * Medical Database Integration Examples
 * 醫療資料庫整合使用範例
 */

import { 
  medicalDatabaseManager,
  type DiagnosisRequest,
  type DiagnosisEvidence,
  type FHIRPatient,
  type FHIRObservation
} from '../utils/medical-database-integrations';

/**
 * Infermedica API 使用範例
 */
export class InfermedicaExamples {
  
  /**
   * 範例 1: 基本症狀搜尋
   */
  static async basicSymptomSearch() {
    console.log('=== Infermedica 基本症狀搜尋範例 ===');
    
    try {
      const infermedica = medicalDatabaseManager.getInfermedica();
      
      // 搜尋頭痛相關症狀
      const symptoms = await infermedica.searchMedicalConcepts('headache', 30, 'female');
      
      console.log('找到的症狀:');
      symptoms.forEach(symptom => {
        console.log(`- ${symptom.name} (${symptom.commonName || 'N/A'})`);
        console.log(`  ID: ${symptom.id}, 類型: ${symptom.type}`);
      });
      
      return symptoms;
    } catch (error) {
      console.error('症狀搜尋失敗:', error);
      throw error;
    }
  }

  /**
   * 範例 2: 症狀診斷流程
   */
  static async symptomDiagnosisFlow() {
    console.log('=== Infermedica 症狀診斷流程範例 ===');
    
    try {
      const infermedica = medicalDatabaseManager.getInfermedica();
      
      // 初始症狀證據
      const initialEvidence: DiagnosisEvidence[] = [
        { id: 's_21', choice_id: 'present', source: 'initial' }, // 頭痛
        { id: 's_98', choice_id: 'present', source: 'initial' }, // 發燒
        { id: 's_102', choice_id: 'absent', source: 'initial' }  // 噁心
      ];

      const diagnosisRequest: DiagnosisRequest = {
        sex: 'female',
        age: { value: 28 },
        evidence: initialEvidence
      };

      // 執行診斷
      const diagnosis = await infermedica.performDiagnosis(diagnosisRequest);
      
      console.log('診斷結果:');
      console.log(`應該停止: ${diagnosis.should_stop}`);
      
      if (diagnosis.question) {
        console.log(`下一個問題: ${diagnosis.question.text}`);
        console.log(`問題類型: ${diagnosis.question.type}`);
      }
      
      if (diagnosis.conditions) {
        console.log('可能的疾病:');
        diagnosis.conditions.forEach(condition => {
          console.log(`- ${condition.name} (${condition.common_name})`);
          console.log(`  機率: ${(condition.probability * 100).toFixed(1)}%`);
        });
      }
      
      if (diagnosis.triage) {
        console.log(`分診等級: ${diagnosis.triage.level}`);
        console.log(`描述: ${diagnosis.triage.description}`);
      }
      
      return diagnosis;
    } catch (error) {
      console.error('症狀診斷失敗:', error);
      throw error;
    }
  }

  /**
   * 範例 3: 分診建議
   */
  static async triageRecommendation() {
    console.log('=== Infermedica 分診建議範例 ===');
    
    try {
      const infermedica = medicalDatabaseManager.getInfermedica();
      
      // 緊急症狀
      const emergencyEvidence: DiagnosisEvidence[] = [
        { id: 's_29', choice_id: 'present' }, // 胸痛
        { id: 's_102', choice_id: 'present' }, // 呼吸困難
        { id: 's_1197', choice_id: 'present' } // 嚴重胸痛
      ];

      const request: DiagnosisRequest = {
        sex: 'male',
        age: { value: 55 },
        evidence: emergencyEvidence
      };

      const triage = await infermedica.getTriageRecommendation(request);
      
      console.log('分診建議:');
      console.log(`等級: ${triage.level}`);
      console.log(`緊急程度: ${triage.urgency}`);
      console.log(`描述: ${triage.description}`);
      
      // 根據緊急程度提供建議
      switch (triage.urgency) {
        case 'emergency':
          console.log('🚨 建議: 立即就醫或撥打急救電話');
          break;
        case 'consultation':
          console.log('⚠️ 建議: 盡快預約醫師諮詢');
          break;
        case 'self_care':
          console.log('ℹ️ 建議: 可考慮自我照護或觀察');
          break;
      }
      
      return triage;
    } catch (error) {
      console.error('分診建議失敗:', error);
      throw error;
    }
  }

  /**
   * 範例 4: 自然語言症狀解析
   */
  static async naturalLanguageParsing() {
    console.log('=== Infermedica 自然語言症狀解析範例 ===');
    
    try {
      const infermedica = medicalDatabaseManager.getInfermedica();
      
      const symptomText = "I have been experiencing severe headaches and nausea for the past 3 days";
      const parsedSymptoms = await infermedica.parseSymptoms(symptomText, 35);
      
      console.log(`原始文字: "${symptomText}"`);
      console.log('解析出的症狀:');
      
      parsedSymptoms.forEach(symptom => {
        console.log(`- 症狀 ID: ${symptom.id}`);
        console.log(`  狀態: ${symptom.choice_id}`);
        console.log(`  來源: ${symptom.source}`);
      });
      
      return parsedSymptoms;
    } catch (error) {
      console.error('症狀解析失敗:', error);
      throw error;
    }
  }
}

/**
 * Canvas Medical API 使用範例
 */
export class CanvasMedicalExamples {
  
  /**
   * 範例 1: 患者管理流程
   */
  static async patientManagementFlow() {
    console.log('=== Canvas Medical 患者管理流程範例 ===');
    
    try {
      const canvas = medicalDatabaseManager.getCanvasMedical();
      
      // 1. 創建新患者
      const newPatient: Omit<FHIRPatient, 'id'> = {
        resourceType: 'Patient',
        identifier: [
          {
            system: 'http://example.org/patient-ids',
            value: 'P12345'
          }
        ],
        name: [
          {
            family: 'Chen',
            given: ['Wei', 'Ming']
          }
        ],
        gender: 'male',
        birthDate: '1985-03-15',
        telecom: [
          {
            system: 'phone',
            value: '+886-2-1234-5678'
          },
          {
            system: 'email',
            value: 'weiming.chen@example.com'
          }
        ]
      };

      console.log('創建新患者...');
      const createdPatient = await canvas.createPatient(newPatient);
      console.log(`患者已創建，ID: ${createdPatient.id}`);
      
      // 2. 搜尋患者
      console.log('搜尋患者...');
      const searchResults = await canvas.searchPatients({
        name: 'Chen',
        gender: 'male',
        limit: 5
      });
      
      console.log(`找到 ${searchResults.length} 位患者:`);
      searchResults.forEach(patient => {
        const name = patient.name?.[0];
        console.log(`- ${name?.given?.join(' ')} ${name?.family} (ID: ${patient.id})`);
      });
      
      // 3. 獲取患者詳細資訊
      if (createdPatient.id) {
        console.log('獲取患者詳細資訊...');
        const patientDetails = await canvas.getPatient(createdPatient.id);
        console.log('患者詳細資訊:', JSON.stringify(patientDetails, null, 2));
      }
      
      return { createdPatient, searchResults };
    } catch (error) {
      console.error('患者管理流程失敗:', error);
      throw error;
    }
  }

  /**
   * 範例 2: 藥物記錄管理
   */
  static async medicationManagement() {
    console.log('=== Canvas Medical 藥物記錄管理範例 ===');
    
    try {
      const canvas = medicalDatabaseManager.getCanvasMedical();
      
      // 1. 搜尋藥物
      console.log('搜尋藥物...');
      const medications = await canvas.searchMedications({
        text: 'aspirin',
        limit: 5
      });
      
      console.log(`找到 ${medications.length} 種藥物:`);
      medications.forEach(med => {
        console.log(`- ${med.code.text} (ID: ${med.id})`);
        med.code.coding.forEach(coding => {
          console.log(`  系統: ${coding.system}, 代碼: ${coding.code}`);
        });
      });
      
      // 2. 獲取患者藥物記錄（假設患者 ID）
      const patientId = 'patient-example-123';
      console.log(`獲取患者 ${patientId} 的藥物記錄...`);
      
      try {
        const patientMedications = await canvas.getPatientMedications(patientId);
        
        console.log(`患者有 ${patientMedications.length} 項藥物記錄:`);
        patientMedications.forEach(med => {
          console.log(`- 狀態: ${med.status}`);
          if (med.medicationReference) {
            console.log(`  藥物: ${med.medicationReference.display}`);
          }
          if (med.effectivePeriod) {
            console.log(`  期間: ${med.effectivePeriod.start} - ${med.effectivePeriod.end || '進行中'}`);
          }
        });
      } catch (error) {
        console.log('患者不存在或無藥物記錄');
      }
      
      return medications;
    } catch (error) {
      console.error('藥物記錄管理失敗:', error);
      throw error;
    }
  }

  /**
   * 範例 3: 觀察記錄和檢驗結果
   */
  static async observationAndLabResults() {
    console.log('=== Canvas Medical 觀察記錄和檢驗結果範例 ===');
    
    try {
      const canvas = medicalDatabaseManager.getCanvasMedical();
      
      // 1. 創建血壓觀察記錄
      const bloodPressureObservation: Omit<FHIRObservation, 'id'> = {
        resourceType: 'Observation',
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs'
              }
            ]
          }
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '85354-9',
              display: 'Blood pressure panel with all children optional'
            }
          ]
        },
        subject: {
          reference: 'Patient/example-patient-123',
          type: 'Patient'
        },
        component: [
          {
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '8480-6',
                  display: 'Systolic blood pressure'
                }
              ]
            },
            valueQuantity: {
              value: 120,
              unit: 'mmHg'
            }
          },
          {
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '8462-4',
                  display: 'Diastolic blood pressure'
                }
              ]
            },
            valueQuantity: {
              value: 80,
              unit: 'mmHg'
            }
          }
        ]
      };

      console.log('創建血壓觀察記錄...');
      const createdObservation = await canvas.createObservation(bloodPressureObservation);
      console.log(`觀察記錄已創建，ID: ${createdObservation.id}`);
      
      // 2. 創建實驗室報告
      console.log('創建實驗室報告...');
      const labReport = await canvas.createLabReport({
        patientId: 'example-patient-123',
        testName: 'Glucose',
        testCode: '2345-7',
        testSystem: 'http://loinc.org',
        effectiveDateTime: new Date().toISOString(),
        value: 95,
        unit: 'mg/dL',
        referenceRange: {
          low: 70,
          high: 100,
          text: '70-100 mg/dL'
        }
      });
      
      console.log('實驗室報告已創建:', JSON.stringify(labReport, null, 2));
      
      return { createdObservation, labReport };
    } catch (error) {
      console.error('觀察記錄和檢驗結果失敗:', error);
      throw error;
    }
  }
}

/**
 * 藥物交互作用檢查範例
 */
export class DrugInteractionExamples {
  
  /**
   * 範例 1: 基本藥物交互作用檢查
   */
  static async basicInteractionCheck() {
    console.log('=== 基本藥物交互作用檢查範例 ===');
    
    try {
      const drugInteraction = medicalDatabaseManager.getDrugInteraction();
      
      // 檢查多種藥物的交互作用
      const medications = [
        { name: 'Warfarin', rxcui: '11289' },
        { name: 'Aspirin', rxcui: '1191' },
        { name: 'Ibuprofen', rxcui: '5640' }
      ];

      console.log('檢查藥物交互作用...');
      console.log('藥物清單:');
      medications.forEach(med => {
        console.log(`- ${med.name} (RxCUI: ${med.rxcui})`);
      });
      
      const interactions = await drugInteraction.checkDrugInteractions(medications);
      
      console.log(`\n發現 ${interactions.length} 個交互作用:`);
      interactions.forEach(interaction => {
        console.log(`\n🔄 ${interaction.drug1} ↔ ${interaction.drug2}`);
        console.log(`   嚴重程度: ${interaction.severity.toUpperCase()}`);
        console.log(`   描述: ${interaction.description}`);
        
        if (interaction.mechanism) {
          console.log(`   機制: ${interaction.mechanism}`);
        }
        
        if (interaction.management) {
          console.log(`   處理建議: ${interaction.management}`);
        }
        
        // 根據嚴重程度顯示警告
        switch (interaction.severity) {
          case 'major':
            console.log('   ⚠️ 警告: 重大交互作用，需要密切監控');
            break;
          case 'moderate':
            console.log('   ⚡ 注意: 中度交互作用，建議調整劑量');
            break;
          case 'minor':
            console.log('   ℹ️ 提醒: 輕微交互作用，注意觀察');
            break;
        }
      });
      
      return interactions;
    } catch (error) {
      console.error('藥物交互作用檢查失敗:', error);
      throw error;
    }
  }

  /**
   * 範例 2: 藥物詳細資訊查詢
   */
  static async medicationDetailsLookup() {
    console.log('=== 藥物詳細資訊查詢範例 ===');
    
    try {
      const drugInteraction = medicalDatabaseManager.getDrugInteraction();
      
      const medications = [
        { name: 'Metformin' },
        { rxcui: '6809' }, // Insulin
        { ndc: '0069-2587-68' } // Example NDC
      ];

      console.log('查詢藥物詳細資訊...');
      
      for (const med of medications) {
        try {
          console.log(`\n查詢: ${JSON.stringify(med)}`);
          const details = await drugInteraction.getMedicationDetails(med);
          
          if (details) {
            console.log(`✅ 藥物名稱: ${details.name}`);
            if (details.rxcui) console.log(`   RxCUI: ${details.rxcui}`);
            if (details.ndc) console.log(`   NDC: ${details.ndc}`);
            if (details.dosageForm) console.log(`   劑型: ${details.dosageForm}`);
            if (details.strength) console.log(`   強度: ${details.strength}`);
            if (details.manufacturer) console.log(`   製造商: ${details.manufacturer}`);
            
            if (details.ingredients.length > 0) {
              console.log(`   成分: ${details.ingredients.join(', ')}`);
            }
          } else {
            console.log('❌ 未找到藥物資訊');
          }
        } catch (error) {
          console.log(`❌ 查詢失敗: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('藥物詳細資訊查詢失敗:', error);
      throw error;
    }
  }
}

/**
 * 綜合整合範例
 */
export class IntegratedMedicalExamples {
  
  /**
   * 範例: 完整的患者診療流程
   */
  static async completePatientCareFlow() {
    console.log('=== 完整患者診療流程範例 ===');
    
    try {
      // 1. 症狀評估
      console.log('\n📋 步驟 1: 症狀評估');
      const infermedica = medicalDatabaseManager.getInfermedica();
      
      const symptoms = await infermedica.parseSymptoms(
        "Patient reports chest pain and shortness of breath",
        45
      );
      
      console.log('解析出的症狀:');
      symptoms.forEach(symptom => {
        console.log(`- ${symptom.id}: ${symptom.choice_id}`);
      });
      
      // 2. 診斷建議
      console.log('\n🔍 步驟 2: 診斷建議');
      const diagnosisRequest: DiagnosisRequest = {
        sex: 'male',
        age: { value: 45 },
        evidence: symptoms
      };
      
      const diagnosis = await infermedica.performDiagnosis(diagnosisRequest);
      const triage = await infermedica.getTriageRecommendation(diagnosisRequest);
      
      console.log(`分診等級: ${triage.level} (${triage.urgency})`);
      if (diagnosis.conditions) {
        console.log('可能診斷:');
        diagnosis.conditions.slice(0, 3).forEach(condition => {
          console.log(`- ${condition.name}: ${(condition.probability * 100).toFixed(1)}%`);
        });
      }
      
      // 3. 患者記錄管理
      console.log('\n👤 步驟 3: 患者記錄管理');
      const canvas = medicalDatabaseManager.getCanvasMedical();
      
      // 模擬患者查詢
      const patients = await canvas.searchPatients({
        name: 'John',
        limit: 1
      });
      
      console.log(`找到 ${patients.length} 位患者記錄`);
      
      // 4. 藥物交互作用檢查
      console.log('\n💊 步驟 4: 藥物交互作用檢查');
      const drugInteraction = medicalDatabaseManager.getDrugInteraction();
      
      const currentMedications = [
        { name: 'Aspirin', rxcui: '1191' },
        { name: 'Lisinopril', rxcui: '29046' }
      ];
      
      const interactions = await drugInteraction.checkDrugInteractions(currentMedications);
      
      if (interactions.length > 0) {
        console.log('⚠️ 發現藥物交互作用:');
        interactions.forEach(interaction => {
          console.log(`- ${interaction.drug1} ↔ ${interaction.drug2} (${interaction.severity})`);
        });
      } else {
        console.log('✅ 未發現重要藥物交互作用');
      }
      
      // 5. 健康檢查
      console.log('\n🏥 步驟 5: 系統健康檢查');
      const healthCheck = await medicalDatabaseManager.performHealthCheck();
      
      console.log('系統狀態:');
      console.log(`- Infermedica: ${healthCheck.infermedica ? '✅' : '❌'}`);
      console.log(`- Canvas Medical: ${healthCheck.canvasMedical ? '✅' : '❌'}`);
      console.log(`- 藥物交互作用: ${healthCheck.drugInteraction ? '✅' : '❌'}`);
      console.log(`- 整體狀態: ${healthCheck.overall ? '✅' : '❌'}`);
      
      return {
        symptoms,
        diagnosis,
        triage,
        patients,
        interactions,
        healthCheck
      };
    } catch (error) {
      console.error('完整患者診療流程失敗:', error);
      throw error;
    }
  }
}

/**
 * 執行所有範例的主函數
 */
export async function runAllMedicalDatabaseExamples() {
  console.log('🏥 開始執行醫療資料庫整合範例...\n');
  
  try {
    // Infermedica 範例
    await InfermedicaExamples.basicSymptomSearch();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await InfermedicaExamples.symptomDiagnosisFlow();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await InfermedicaExamples.triageRecommendation();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Canvas Medical 範例
    await CanvasMedicalExamples.patientManagementFlow();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await CanvasMedicalExamples.medicationManagement();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 藥物交互作用範例
    await DrugInteractionExamples.basicInteractionCheck();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 綜合範例
    await IntegratedMedicalExamples.completePatientCareFlow();
    
    console.log('\n✅ 所有醫療資料庫整合範例執行完成！');
  } catch (error) {
    console.error('❌ 範例執行失敗:', error);
  }
}

// 如果直接執行此檔案，則運行所有範例
if (import.meta.main) {
  runAllMedicalDatabaseExamples();
}