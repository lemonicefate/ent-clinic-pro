// 智能內容推薦系統
import type { CalculatorConfig } from '../types/calculator';

export interface RecommendationItem {
  id: string;
  title: string;
  type: 'calculator' | 'education' | 'specialty';
  url: string;
  description?: string;
  category?: string;
  tags?: string[];
  relevanceScore: number;
  reason: string; // 推薦原因
}

export interface UserProfile {
  specialty?: string;
  interests: string[];
  recentViews: string[];
  calculatorUsage: Map<string, number>;
  searchHistory: string[];
  preferredLanguage: string;
}

export interface ContentMetadata {
  id: string;
  title: string;
  type: 'calculator' | 'education';
  specialty: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popularity: number;
  lastUpdated: Date;
  relatedContent: string[];
}

export class IntelligentRecommendationEngine {
  private static userProfile: UserProfile = {
    interests: [],
    recentViews: [],
    calculatorUsage: new Map(),
    searchHistory: [],
    preferredLanguage: 'zh-TW'
  };
  
  private static contentDatabase: Map<string, ContentMetadata> = new Map();
  private static userInteractions: Map<string, number> = new Map();
  private static contentSimilarity: Map<string, Map<string, number>> = new Map();

  static initialize() {
    this.loadUserProfile();
    this.loadContentDatabase();
    this.buildContentSimilarityMatrix();
  }

  // 獲取個人化推薦
  static async getPersonalizedRecommendations(
    currentContentId?: string,
    limit: number = 6
  ): Promise<RecommendationItem[]> {
    const recommendations: RecommendationItem[] = [];
    
    // 1. 基於當前內容的相似推薦
    if (currentContentId) {
      const similarRecommendations = this.getSimilarContentRecommendations(
        currentContentId, 
        Math.ceil(limit * 0.4)
      );
      recommendations.push(...similarRecommendations);
    }

    // 2. 基於用戶興趣的推薦
    const interestRecommendations = this.getInterestBasedRecommendations(
      Math.ceil(limit * 0.3)
    );
    recommendations.push(...interestRecommendations);

    // 3. 基於專科的推薦
    if (this.userProfile.specialty) {
      const specialtyRecommendations = this.getSpecialtyRecommendations(
        this.userProfile.specialty,
        Math.ceil(limit * 0.2)
      );
      recommendations.push(...specialtyRecommendations);
    }

    // 4. 熱門內容推薦
    const popularRecommendations = this.getPopularRecommendations(
      Math.ceil(limit * 0.1)
    );
    recommendations.push(...popularRecommendations);

    // 去重並排序
    return this.deduplicateAndRank(recommendations, limit);
  }

  // 基於相似內容的推薦
  private static getSimilarContentRecommendations(
    contentId: string, 
    limit: number
  ): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];
    const similarities = this.contentSimilarity.get(contentId);
    
    if (!similarities) return recommendations;

    const sortedSimilar = [...similarities.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    for (const [similarId, similarity] of sortedSimilar) {
      const content = this.contentDatabase.get(similarId);
      if (content) {
        recommendations.push({
          id: similarId,
          title: content.title,
          type: content.type,
          url: content.type === 'calculator' ? `/tools/${similarId}` : `/education/${similarId}`,
          description: `與當前內容相似度: ${Math.round(similarity * 100)}%`,
          category: content.specialty,
          tags: content.tags,
          relevanceScore: similarity,
          reason: '基於內容相似性推薦'
        });
      }
    }

    return recommendations;
  }

  // 基於用戶興趣的推薦
  private static getInterestBasedRecommendations(limit: number): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];
    const interests = this.userProfile.interests;
    
    if (interests.length === 0) return recommendations;

    for (const [contentId, metadata] of this.contentDatabase.entries()) {
      // 計算興趣匹配度
      const interestScore = this.calculateInterestScore(metadata, interests);
      
      if (interestScore > 0.3) {
        recommendations.push({
          id: contentId,
          title: metadata.title,
          type: metadata.type,
          url: metadata.type === 'calculator' ? `/tools/${contentId}` : `/education/${contentId}`,
          description: this.getInterestDescription(metadata, interests),
          category: metadata.specialty,
          tags: metadata.tags,
          relevanceScore: interestScore,
          reason: '基於您的興趣推薦'
        });
      }
    }

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // 基於專科的推薦
  private static getSpecialtyRecommendations(
    specialty: string, 
    limit: number
  ): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];
    
    for (const [contentId, metadata] of this.contentDatabase.entries()) {
      if (metadata.specialty === specialty) {
        // 避免推薦最近已經查看的內容
        if (!this.userProfile.recentViews.includes(contentId)) {
          const popularityScore = metadata.popularity / 100; // 標準化
          
          recommendations.push({
            id: contentId,
            title: metadata.title,
            type: metadata.type,
            url: metadata.type === 'calculator' ? `/tools/${contentId}` : `/education/${contentId}`,
            description: `${specialty}專科相關內容`,
            category: metadata.specialty,
            tags: metadata.tags,
            relevanceScore: popularityScore,
            reason: `${specialty}專科推薦`
          });
        }
      }
    }

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // 熱門內容推薦
  private static getPopularRecommendations(limit: number): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];
    
    const sortedByPopularity = [...this.contentDatabase.entries()]
      .sort(([, a], [, b]) => b.popularity - a.popularity)
      .slice(0, limit * 2); // 取更多候選項

    for (const [contentId, metadata] of sortedByPopularity) {
      // 避免推薦最近已經查看的內容
      if (!this.userProfile.recentViews.includes(contentId)) {
        recommendations.push({
          id: contentId,
          title: metadata.title,
          type: metadata.type,
          url: metadata.type === 'calculator' ? `/tools/${contentId}` : `/education/${contentId}`,
          description: `熱門度: ${metadata.popularity}`,
          category: metadata.specialty,
          tags: metadata.tags,
          relevanceScore: metadata.popularity / 100,
          reason: '熱門內容推薦'
        });
      }
      
      if (recommendations.length >= limit) break;
    }

    return recommendations;
  }

  // 計算興趣匹配分數
  private static calculateInterestScore(
    metadata: ContentMetadata, 
    interests: string[]
  ): number {
    let score = 0;
    const totalInterests = interests.length;
    
    if (totalInterests === 0) return 0;

    // 檢查標題匹配
    for (const interest of interests) {
      if (metadata.title.toLowerCase().includes(interest.toLowerCase())) {
        score += 0.4;
      }
    }

    // 檢查標籤匹配
    for (const tag of metadata.tags) {
      for (const interest of interests) {
        if (tag.toLowerCase().includes(interest.toLowerCase())) {
          score += 0.3;
        }
      }
    }

    // 檢查專科匹配
    for (const interest of interests) {
      if (metadata.specialty.toLowerCase().includes(interest.toLowerCase())) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0); // 限制最大分數為 1.0
  }

  // 獲取興趣描述
  private static getInterestDescription(
    metadata: ContentMetadata, 
    interests: string[]
  ): string {
    const matchedInterests = interests.filter(interest =>
      metadata.title.toLowerCase().includes(interest.toLowerCase()) ||
      metadata.tags.some(tag => tag.toLowerCase().includes(interest.toLowerCase())) ||
      metadata.specialty.toLowerCase().includes(interest.toLowerCase())
    );

    if (matchedInterests.length > 0) {
      return `符合您的興趣: ${matchedInterests.join(', ')}`;
    }

    return '推薦給您';
  }

  // 去重並排序推薦結果
  private static deduplicateAndRank(
    recommendations: RecommendationItem[], 
    limit: number
  ): RecommendationItem[] {
    // 去重
    const uniqueRecommendations = recommendations.reduce((acc, current) => {
      const existing = acc.find(item => item.id === current.id);
      if (!existing || existing.relevanceScore < current.relevanceScore) {
        return [...acc.filter(item => item.id !== current.id), current];
      }
      return acc;
    }, [] as RecommendationItem[]);

    // 排序：相關性分數 + 時間衰減 + 多樣性
    return uniqueRecommendations
      .map(rec => ({
        ...rec,
        relevanceScore: this.adjustRelevanceScore(rec)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // 調整相關性分數
  private static adjustRelevanceScore(recommendation: RecommendationItem): number {
    let score = recommendation.relevanceScore;
    
    // 時間衰減：較新的內容獲得加分
    const content = this.contentDatabase.get(recommendation.id);
    if (content) {
      const daysSinceUpdate = (Date.now() - content.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      const timeDecay = Math.exp(-daysSinceUpdate / 30); // 30天半衰期
      score *= (0.7 + 0.3 * timeDecay);
    }

    // 用戶互動加分
    const interactions = this.userInteractions.get(recommendation.id) || 0;
    score *= (1 + Math.log(interactions + 1) * 0.1);

    // 多樣性調整：避免同一類型內容過多
    const recentViewTypes = this.userProfile.recentViews
      .slice(0, 5)
      .map(id => this.contentDatabase.get(id)?.type)
      .filter(Boolean);
    
    const typeCount = recentViewTypes.filter(type => type === recommendation.type).length;
    if (typeCount > 2) {
      score *= 0.8; // 降低相同類型內容的分數
    }

    return score;
  }

  // 記錄用戶行為
  static recordUserBehavior(
    contentId: string, 
    action: 'view' | 'calculate' | 'share' | 'bookmark',
    metadata?: any
  ) {
    // 更新最近查看
    this.userProfile.recentViews = [
      contentId,
      ...this.userProfile.recentViews.filter(id => id !== contentId)
    ].slice(0, 20);

    // 更新互動計數
    const currentCount = this.userInteractions.get(contentId) || 0;
    const actionWeight = { view: 1, calculate: 3, share: 2, bookmark: 2 }[action];
    this.userInteractions.set(contentId, currentCount + actionWeight);

    // 更新計算機使用統計
    if (action === 'calculate') {
      const usage = this.userProfile.calculatorUsage.get(contentId) || 0;
      this.userProfile.calculatorUsage.set(contentId, usage + 1);
    }

    // 更新興趣標籤
    const content = this.contentDatabase.get(contentId);
    if (content) {
      this.updateUserInterests(content);
    }

    // 持久化用戶資料
    this.saveUserProfile();
  }

  // 更新用戶興趣
  private static updateUserInterests(content: ContentMetadata) {
    // 基於查看的內容更新興趣標籤
    const newInterests = [...content.tags, content.specialty];
    
    for (const interest of newInterests) {
      if (!this.userProfile.interests.includes(interest)) {
        this.userProfile.interests.push(interest);
      }
    }

    // 限制興趣數量，保留最相關的
    if (this.userProfile.interests.length > 20) {
      this.userProfile.interests = this.userProfile.interests.slice(0, 20);
    }
  }

  // 建立內容相似性矩陣
  private static buildContentSimilarityMatrix() {
    const contents = [...this.contentDatabase.values()];
    
    for (let i = 0; i < contents.length; i++) {
      const contentA = contents[i];
      const similarities = new Map<string, number>();
      
      for (let j = 0; j < contents.length; j++) {
        if (i !== j) {
          const contentB = contents[j];
          const similarity = this.calculateContentSimilarity(contentA, contentB);
          if (similarity > 0.2) { // 只保存相似度較高的
            similarities.set(contentB.id, similarity);
          }
        }
      }
      
      this.contentSimilarity.set(contentA.id, similarities);
    }
  }

  // 計算內容相似度
  private static calculateContentSimilarity(
    contentA: ContentMetadata, 
    contentB: ContentMetadata
  ): number {
    let similarity = 0;

    // 專科相同加分
    if (contentA.specialty === contentB.specialty) {
      similarity += 0.4;
    }

    // 標籤重疊度
    const commonTags = contentA.tags.filter(tag => contentB.tags.includes(tag));
    const tagSimilarity = commonTags.length / Math.max(contentA.tags.length, contentB.tags.length);
    similarity += tagSimilarity * 0.4;

    // 難度相似度
    const difficultyScore = contentA.difficulty === contentB.difficulty ? 0.2 : 0;
    similarity += difficultyScore;

    return Math.min(similarity, 1.0);
  }

  // 載入用戶資料
  private static loadUserProfile() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('medical-user-profile');
      if (stored) {
        const profile = JSON.parse(stored);
        this.userProfile = {
          ...this.userProfile,
          ...profile,
          calculatorUsage: new Map(profile.calculatorUsage || [])
        };
      }

      const interactions = localStorage.getItem('medical-user-interactions');
      if (interactions) {
        this.userInteractions = new Map(JSON.parse(interactions));
      }
    }
  }

  // 保存用戶資料
  private static saveUserProfile() {
    if (typeof window !== 'undefined') {
      const profileToSave = {
        ...this.userProfile,
        calculatorUsage: [...this.userProfile.calculatorUsage.entries()]
      };
      
      localStorage.setItem('medical-user-profile', JSON.stringify(profileToSave));
      localStorage.setItem(
        'medical-user-interactions', 
        JSON.stringify([...this.userInteractions.entries()])
      );
    }
  }

  // 載入內容資料庫
  private static async loadContentDatabase() {
    try {
      // 這裡應該從實際的 API 或數據源載入
      // 暫時使用模擬數據
      const mockContent: ContentMetadata[] = [
        {
          id: 'bmi',
          title: 'BMI 計算機',
          type: 'calculator',
          specialty: '內分泌科',
          tags: ['BMI', '體重', '肥胖', '健康評估'],
          difficulty: 'beginner',
          popularity: 95,
          lastUpdated: new Date('2024-01-15'),
          relatedContent: ['diabetes-risk', 'metabolic-syndrome']
        },
        {
          id: 'cha2ds2-vasc',
          title: 'CHA₂DS₂-VASc 評分',
          type: 'calculator',
          specialty: '心臟科',
          tags: ['心房顫動', '中風風險', '抗凝血'],
          difficulty: 'intermediate',
          popularity: 88,
          lastUpdated: new Date('2024-01-10'),
          relatedContent: ['atrial-fibrillation', 'stroke-prevention']
        },
        {
          id: 'egfr',
          title: 'eGFR 計算機',
          type: 'calculator',
          specialty: '腎臟科',
          tags: ['腎功能', 'eGFR', '慢性腎病'],
          difficulty: 'intermediate',
          popularity: 82,
          lastUpdated: new Date('2024-01-12'),
          relatedContent: ['chronic-kidney-disease', 'dialysis']
        }
      ];

      for (const content of mockContent) {
        this.contentDatabase.set(content.id, content);
      }
    } catch (error) {
      console.error('Failed to load content database:', error);
    }
  }

  // 獲取用戶統計
  static getUserStats() {
    return {
      totalViews: this.userProfile.recentViews.length,
      totalCalculations: [...this.userProfile.calculatorUsage.values()].reduce((a, b) => a + b, 0),
      topInterests: this.userProfile.interests.slice(0, 5),
      favoriteSpecialty: this.userProfile.specialty,
      recentActivity: this.userProfile.recentViews.slice(0, 5)
    };
  }

  // 清除用戶資料
  static clearUserData() {
    this.userProfile = {
      interests: [],
      recentViews: [],
      calculatorUsage: new Map(),
      searchHistory: [],
      preferredLanguage: 'zh-TW'
    };
    this.userInteractions.clear();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medical-user-profile');
      localStorage.removeItem('medical-user-interactions');
    }
  }
}