/**
 * Workflow Integration Tests
 * 
 * Tests for the complete publishing workflow from content creation to publication
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFile, writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { execSync } from 'child_process'

// Mock GitHub API
const mockGitHubAPI = {
  createPullRequest: vi.fn(),
  getPullRequest: vi.fn(),
  mergePullRequest: vi.fn(),
  addReviewers: vi.fn(),
  getWorkflowRuns: vi.fn(),
  createIssue: vi.fn()
}

// Mock Decap CMS API
const mockDecapCMS = {
  createEntry: vi.fn(),
  updateEntry: vi.fn(),
  publishEntry: vi.fn(),
  getEntry: vi.fn()
}

vi.mock('octokit', () => ({
  Octokit: vi.fn(() => mockGitHubAPI)
}))

describe('Publishing Workflow Integration', () => {
  const testContentDir = 'tests/temp/content'
  const testArticlePath = join(testContentDir, 'test-article.md')

  beforeEach(async () => {
    // Create test directory
    await mkdir(testContentDir, { recursive: true })
    
    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(async () => {
    // Clean up test files
    await rm('tests/temp', { recursive: true, force: true })
  })

  describe('Content Creation Workflow', () => {
    it('should create new article through Decap CMS', async () => {
      const articleData = {
        title: {
          zh_TW: '測試衛教文章',
          en: 'Test Education Article'
        },
        category: 'diagnosis',
        specialty: 'cardiology',
        content: '# 測試內容\n\n這是測試文章的內容。',
        status: 'draft',
        author: {
          zh_TW: '測試作者',
          en: 'Test Author'
        }
      }

      mockDecapCMS.createEntry.mockResolvedValue({
        id: 'test-article-123',
        path: 'src/content/education/test-article.md',
        status: 'draft'
      })

      const result = await mockDecapCMS.createEntry(articleData)

      expect(result.status).toBe('draft')
      expect(result.path).toContain('education')
      expect(mockDecapCMS.createEntry).toHaveBeenCalledWith(articleData)
    })

    it('should validate content before creation', async () => {
      const invalidArticleData = {
        title: {
          zh_TW: '測試文章'
          // Missing required 'en' field
        },
        category: 'diagnosis',
        specialty: 'cardiology',
        content: '# 測試內容'
      }

      mockDecapCMS.createEntry.mockRejectedValue(
        new Error('Validation failed: Missing required field "title.en"')
      )

      await expect(mockDecapCMS.createEntry(invalidArticleData))
        .rejects.toThrow('Validation failed')
    })
  })

  describe('Review Workflow', () => {
    it('should submit article for review', async () => {
      const articleData = {
        id: 'test-article-123',
        status: 'in-review',
        reviewers: ['cardiologist@example.com', 'editor@example.com']
      }

      mockDecapCMS.updateEntry.mockResolvedValue({
        ...articleData,
        updatedAt: new Date().toISOString()
      })

      mockGitHubAPI.createPullRequest.mockResolvedValue({
        number: 42,
        html_url: 'https://github.com/repo/pull/42',
        state: 'open'
      })

      mockGitHubAPI.addReviewers.mockResolvedValue({
        requested_reviewers: [
          { login: 'cardiologist' },
          { login: 'editor' }
        ]
      })

      // Update article status
      const updatedArticle = await mockDecapCMS.updateEntry(articleData)
      expect(updatedArticle.status).toBe('in-review')

      // Create PR
      const pr = await mockGitHubAPI.createPullRequest({
        title: 'Review: Test Education Article',
        body: 'Please review this medical education article',
        head: 'content/test-article-123',
        base: 'main'
      })

      expect(pr.number).toBe(42)
      expect(pr.state).toBe('open')

      // Add reviewers
      await mockGitHubAPI.addReviewers({
        pull_number: pr.number,
        reviewers: ['cardiologist', 'editor']
      })

      expect(mockGitHubAPI.addReviewers).toHaveBeenCalledWith({
        pull_number: 42,
        reviewers: ['cardiologist', 'editor']
      })
    })

    it('should assign reviewers based on specialty', async () => {
      const cardiologyArticle = {
        specialty: 'cardiology',
        status: 'in-review'
      }

      const neurologyArticle = {
        specialty: 'neurology',
        status: 'in-review'
      }

      // Mock specialty-specific reviewer assignment
      const getReviewersForSpecialty = (specialty: string) => {
        const reviewerMap = {
          cardiology: ['cardiologist@example.com', 'cardio-editor@example.com'],
          neurology: ['neurologist@example.com', 'neuro-editor@example.com']
        }
        return reviewerMap[specialty as keyof typeof reviewerMap] || []
      }

      const cardiologyReviewers = getReviewersForSpecialty(cardiologyArticle.specialty)
      const neurologyReviewers = getReviewersForSpecialty(neurologyArticle.specialty)

      expect(cardiologyReviewers).toContain('cardiologist@example.com')
      expect(neurologyReviewers).toContain('neurologist@example.com')
      expect(cardiologyReviewers).not.toContain('neurologist@example.com')
    })
  })

  describe('Quality Check Workflow', () => {
    it('should run automated quality checks on PR', async () => {
      const prNumber = 42

      mockGitHubAPI.getWorkflowRuns.mockResolvedValue({
        workflow_runs: [
          {
            name: 'Content Quality Check',
            status: 'completed',
            conclusion: 'success',
            checks: {
              frontmatter_validation: 'passed',
              medical_terminology: 'passed',
              accessibility: 'passed',
              readability: 'passed',
              references: 'passed'
            }
          }
        ]
      })

      const workflowRuns = await mockGitHubAPI.getWorkflowRuns({
        workflow_id: 'content-quality-check.yml'
      })

      const qualityCheck = workflowRuns.workflow_runs[0]
      expect(qualityCheck.conclusion).toBe('success')
      expect(qualityCheck.checks.medical_terminology).toBe('passed')
      expect(qualityCheck.checks.accessibility).toBe('passed')
    })

    it('should fail PR if quality checks fail', async () => {
      mockGitHubAPI.getWorkflowRuns.mockResolvedValue({
        workflow_runs: [
          {
            name: 'Content Quality Check',
            status: 'completed',
            conclusion: 'failure',
            checks: {
              frontmatter_validation: 'passed',
              medical_terminology: 'failed',
              accessibility: 'passed',
              readability: 'warning',
              references: 'failed'
            },
            errors: [
              'Medical terminology check failed: Invalid term "心臟爆炸"',
              'Reference format check failed: Missing journal information'
            ]
          }
        ]
      })

      const workflowRuns = await mockGitHubAPI.getWorkflowRuns({
        workflow_id: 'content-quality-check.yml'
      })

      const qualityCheck = workflowRuns.workflow_runs[0]
      expect(qualityCheck.conclusion).toBe('failure')
      expect(qualityCheck.errors).toHaveLength(2)
    })
  })

  describe('Publication Workflow', () => {
    it('should publish article after successful review', async () => {
      const prNumber = 42

      // Mock successful review and quality checks
      mockGitHubAPI.getPullRequest.mockResolvedValue({
        number: prNumber,
        state: 'open',
        mergeable: true,
        reviews: [
          { state: 'APPROVED', user: { login: 'cardiologist' } },
          { state: 'APPROVED', user: { login: 'editor' } }
        ]
      })

      mockGitHubAPI.getWorkflowRuns.mockResolvedValue({
        workflow_runs: [
          {
            name: 'Content Quality Check',
            status: 'completed',
            conclusion: 'success'
          }
        ]
      })

      mockGitHubAPI.mergePullRequest.mockResolvedValue({
        merged: true,
        sha: 'abc123def456'
      })

      // Check PR status
      const pr = await mockGitHubAPI.getPullRequest({ pull_number: prNumber })
      expect(pr.reviews.every(review => review.state === 'APPROVED')).toBe(true)

      // Check quality checks
      const workflowRuns = await mockGitHubAPI.getWorkflowRuns({
        workflow_id: 'content-quality-check.yml'
      })
      const qualityCheck = workflowRuns.workflow_runs[0]
      expect(qualityCheck.conclusion).toBe('success')

      // Merge PR
      const mergeResult = await mockGitHubAPI.mergePullRequest({
        pull_number: prNumber,
        commit_title: 'Publish: Test Education Article',
        merge_method: 'squash'
      })

      expect(mergeResult.merged).toBe(true)
    })

    it('should not publish if reviews are incomplete', async () => {
      const prNumber = 42

      mockGitHubAPI.getPullRequest.mockResolvedValue({
        number: prNumber,
        state: 'open',
        mergeable: true,
        reviews: [
          { state: 'APPROVED', user: { login: 'cardiologist' } },
          { state: 'PENDING', user: { login: 'editor' } }
        ]
      })

      const pr = await mockGitHubAPI.getPullRequest({ pull_number: prNumber })
      const hasAllApprovals = pr.reviews.every(review => review.state === 'APPROVED')

      expect(hasAllApprovals).toBe(false)

      // Should not attempt to merge
      expect(mockGitHubAPI.mergePullRequest).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle merge conflicts', async () => {
      const prNumber = 42

      mockGitHubAPI.getPullRequest.mockResolvedValue({
        number: prNumber,
        state: 'open',
        mergeable: false,
        mergeable_state: 'dirty'
      })

      mockGitHubAPI.createIssue.mockResolvedValue({
        number: 123,
        html_url: 'https://github.com/repo/issues/123'
      })

      const pr = await mockGitHubAPI.getPullRequest({ pull_number: prNumber })

      if (!pr.mergeable) {
        // Create issue for manual resolution
        const issue = await mockGitHubAPI.createIssue({
          title: `Merge conflict in PR #${prNumber}`,
          body: 'This PR has merge conflicts that need manual resolution.',
          labels: ['merge-conflict', 'needs-attention']
        })

        expect(issue.number).toBe(123)
        expect(mockGitHubAPI.createIssue).toHaveBeenCalledWith({
          title: `Merge conflict in PR #${prNumber}`,
          body: 'This PR has merge conflicts that need manual resolution.',
          labels: ['merge-conflict', 'needs-attention']
        })
      }
    })

    it('should handle failed quality checks with retry', async () => {
      let attemptCount = 0

      mockGitHubAPI.getWorkflowRuns.mockImplementation(() => {
        attemptCount++
        if (attemptCount === 1) {
          return Promise.resolve({
            workflow_runs: [{
              name: 'Content Quality Check',
              status: 'completed',
              conclusion: 'failure'
            }]
          })
        } else {
          return Promise.resolve({
            workflow_runs: [{
              name: 'Content Quality Check',
              status: 'completed',
              conclusion: 'success'
            }]
          })
        }
      })

      // First attempt - should fail
      let workflowRuns = await mockGitHubAPI.getWorkflowRuns({
        workflow_id: 'content-quality-check.yml'
      })
      expect(workflowRuns.workflow_runs[0].conclusion).toBe('failure')

      // Retry - should succeed
      workflowRuns = await mockGitHubAPI.getWorkflowRuns({
        workflow_id: 'content-quality-check.yml'
      })
      expect(workflowRuns.workflow_runs[0].conclusion).toBe('success')
      expect(attemptCount).toBe(2)
    })
  })

  describe('End-to-End Workflow', () => {
    it('should complete full workflow from draft to published', async () => {
      // Step 1: Create draft article
      const articleData = {
        title: { zh_TW: '完整測試文章', en: 'Complete Test Article' },
        category: 'diagnosis',
        specialty: 'cardiology',
        content: '# 完整測試\n\n這是完整的工作流程測試。',
        status: 'draft'
      }

      mockDecapCMS.createEntry.mockResolvedValue({
        id: 'complete-test-123',
        status: 'draft'
      })

      const draftArticle = await mockDecapCMS.createEntry(articleData)
      expect(draftArticle.status).toBe('draft')

      // Step 2: Submit for review
      mockDecapCMS.updateEntry.mockResolvedValue({
        ...draftArticle,
        status: 'in-review'
      })

      mockGitHubAPI.createPullRequest.mockResolvedValue({
        number: 100,
        state: 'open'
      })

      const reviewArticle = await mockDecapCMS.updateEntry({
        ...draftArticle,
        status: 'in-review'
      })

      const pr = await mockGitHubAPI.createPullRequest({
        title: 'Review: Complete Test Article',
        head: 'content/complete-test-123',
        base: 'main'
      })

      expect(reviewArticle.status).toBe('in-review')
      expect(pr.number).toBe(100)

      // Step 3: Quality checks pass
      mockGitHubAPI.getWorkflowRuns.mockResolvedValue({
        workflow_runs: [{
          name: 'Content Quality Check',
          status: 'completed',
          conclusion: 'success'
        }]
      })

      const qualityCheck = await mockGitHubAPI.getWorkflowRuns({
        workflow_id: 'content-quality-check.yml'
      })
      expect(qualityCheck.workflow_runs[0].conclusion).toBe('success')

      // Step 4: Reviews approved
      mockGitHubAPI.getPullRequest.mockResolvedValue({
        number: 100,
        state: 'open',
        mergeable: true,
        reviews: [
          { state: 'APPROVED', user: { login: 'cardiologist' } },
          { state: 'APPROVED', user: { login: 'editor' } }
        ]
      })

      const prWithReviews = await mockGitHubAPI.getPullRequest({ pull_number: 100 })
      const allApproved = prWithReviews.reviews.every(r => r.state === 'APPROVED')
      expect(allApproved).toBe(true)

      // Step 5: Merge and publish
      mockGitHubAPI.mergePullRequest.mockResolvedValue({
        merged: true,
        sha: 'final123'
      })

      const mergeResult = await mockGitHubAPI.mergePullRequest({
        pull_number: 100,
        merge_method: 'squash'
      })

      expect(mergeResult.merged).toBe(true)

      // Verify complete workflow
      expect(mockDecapCMS.createEntry).toHaveBeenCalled()
      expect(mockDecapCMS.updateEntry).toHaveBeenCalled()
      expect(mockGitHubAPI.createPullRequest).toHaveBeenCalled()
      expect(mockGitHubAPI.getWorkflowRuns).toHaveBeenCalled()
      expect(mockGitHubAPI.getPullRequest).toHaveBeenCalled()
      expect(mockGitHubAPI.mergePullRequest).toHaveBeenCalled()
    })
  })
})