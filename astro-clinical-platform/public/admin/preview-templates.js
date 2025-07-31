// Decap CMS 預覽模板
// 為衛教文章提供自定義預覽

// 衛教文章預覽模板
const EducationPreview = createClass({
  render: function() {
    const entry = this.props.entry;
    const title = entry.getIn(['data', 'title']);
    const excerpt = entry.getIn(['data', 'excerpt']);
    const medicalSpecialties = entry.getIn(['data', 'medicalSpecialties']);
    const difficulty = entry.getIn(['data', 'difficulty']);
    const status = entry.getIn(['data', 'status']);
    const readingTime = entry.getIn(['data', 'readingTime']);
    const tags = entry.getIn(['data', 'tags']);
    const featuredImage = entry.getIn(['data', 'featuredImage']);

    // 專科顏色映射
    const specialtyColors = {
      'cardiology': '#e74c3c',
      'neurology': '#9b59b6',
      'orthopedics': '#e67e22',
      'pediatrics': '#f39c12',
      'emergency': '#e74c3c',
      'general': '#3498db',
      'surgery': '#2ecc71',
      'endocrinology': '#9c88ff',
      'nephrology': '#1abc9c',
      'pulmonology': '#34495e'
    };

    // 狀態顏色映射
    const statusColors = {
      'draft': '#95a5a6',
      'in-review': '#f39c12',
      'needs-revision': '#e67e22',
      'quality-check': '#3498db',
      'ready-to-publish': '#2ecc71',
      'published': '#27ae60'
    };

    // 難度等級映射
    const difficultyLabels = {
      'basic': '🟢 基礎',
      'intermediate': '🟡 中級',
      'advanced': '🔴 進階'
    };

    return h('div', {
      style: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }
    }, [
      // 文章標題
      h('div', { style: { marginBottom: '20px' } }, [
        h('h1', {
          style: {
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '10px',
            lineHeight: '1.3'
          }
        }, title ? title.get('zh_TW') || title.get('en') || '未設定標題' : '未設定標題'),
        
        // 狀態和難度標籤
        h('div', {
          style: {
            display: 'flex',
            gap: '10px',
            marginBottom: '15px',
            flexWrap: 'wrap'
          }
        }, [
          // 狀態標籤
          status && h('span', {
            style: {
              backgroundColor: statusColors[status] || '#95a5a6',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          }, status),
          
          // 難度標籤
          difficulty && h('span', {
            style: {
              backgroundColor: '#ecf0f1',
              color: '#2c3e50',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          }, difficultyLabels[difficulty] || difficulty),
          
          // 閱讀時間
          readingTime && h('span', {
            style: {
              backgroundColor: '#ecf0f1',
              color: '#2c3e50',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px'
            }
          }, `📖 ${readingTime} 分鐘`)
        ])
      ]),

      // 專科標籤
      medicalSpecialties && medicalSpecialties.size > 0 && h('div', {
        style: { marginBottom: '20px' }
      }, [
        h('h3', {
          style: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#7f8c8d',
            marginBottom: '8px',
            textTransform: 'uppercase'
          }
        }, '醫療專科'),
        h('div', {
          style: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }
        }, medicalSpecialties.map((specialty, index) => 
          h('span', {
            key: index,
            style: {
              backgroundColor: specialtyColors[specialty] || '#95a5a6',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          }, specialty)
        ).toArray())
      ]),

      // 特色圖片
      featuredImage && featuredImage.get('src') && h('div', {
        style: { marginBottom: '20px' }
      }, [
        h('img', {
          src: this.props.getAsset(featuredImage.get('src')).toString(),
          alt: featuredImage.getIn(['alt', 'zh_TW']) || '文章圖片',
          style: {
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '8px'
          }
        })
      ]),

      // 摘要
      excerpt && excerpt.get('zh_TW') && h('div', {
        style: {
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '20px',
          borderLeft: '4px solid #3498db'
        }
      }, [
        h('h3', {
          style: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#7f8c8d',
            marginBottom: '8px',
            textTransform: 'uppercase'
          }
        }, '文章摘要'),
        h('p', {
          style: {
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#2c3e50',
            margin: '0'
          }
        }, excerpt.get('zh_TW'))
      ]),

      // 標籤
      tags && tags.size > 0 && h('div', {
        style: { marginBottom: '20px' }
      }, [
        h('h3', {
          style: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#7f8c8d',
            marginBottom: '8px',
            textTransform: 'uppercase'
          }
        }, '標籤'),
        h('div', {
          style: {
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap'
          }
        }, tags.map((tag, index) => 
          h('span', {
            key: index,
            style: {
              backgroundColor: '#ecf0f1',
              color: '#2c3e50',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px'
            }
          }, `#${tag}`)
        ).toArray())
      ]),

      // 內容預覽
      h('div', {
        style: {
          borderTop: '1px solid #ecf0f1',
          paddingTop: '20px'
        }
      }, [
        h('h3', {
          style: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#7f8c8d',
            marginBottom: '15px',
            textTransform: 'uppercase'
          }
        }, '內容預覽'),
        h('div', {
          style: {
            fontSize: '16px',
            lineHeight: '1.7',
            color: '#2c3e50'
          }
        }, this.props.widgetFor('body'))
      ])
    ]);
  }
});

// 醫療專科預覽模板
const MedicalSpecialtyPreview = createClass({
  render: function() {
    const entry = this.props.entry;
    const name = entry.getIn(['data', 'name']);
    const description = entry.getIn(['data', 'description']);
    const color = entry.getIn(['data', 'color']);
    const icon = entry.getIn(['data', 'icon']);
    const isActive = entry.getIn(['data', 'isActive']);
    const isFeatured = entry.getIn(['data', 'isFeatured']);

    return h('div', {
      style: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }
    }, [
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: color || '#3498db',
          borderRadius: '8px',
          color: 'white'
        }
      }, [
        icon && h('span', {
          style: {
            fontSize: '48px',
            marginRight: '15px'
          }
        }, icon),
        h('div', {}, [
          h('h1', {
            style: {
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0 0 5px 0'
            }
          }, name ? name.get('zh_TW') || name.get('en') || '未設定名稱' : '未設定名稱'),
          h('div', {
            style: {
              display: 'flex',
              gap: '10px'
            }
          }, [
            isActive && h('span', {
              style: {
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }
            }, '啟用'),
            isFeatured && h('span', {
              style: {
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }
            }, '特色')
          ])
        ])
      ]),
      
      description && description.get('zh_TW') && h('div', {
        style: {
          fontSize: '16px',
          lineHeight: '1.6',
          color: '#2c3e50'
        }
      }, description.get('zh_TW'))
    ]);
  }
});

// 註冊預覽模板
CMS.registerPreviewTemplate('education', EducationPreview);
CMS.registerPreviewTemplate('medical-specialties', MedicalSpecialtyPreview);

// 註冊自定義樣式
const previewStyles = `
  .cms-preview-content {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6;
    color: #2c3e50;
  }
  
  .cms-preview-content h1,
  .cms-preview-content h2,
  .cms-preview-content h3,
  .cms-preview-content h4 {
    color: #2c3e50;
    font-weight: bold;
  }
  
  .cms-preview-content h1 {
    font-size: 28px;
    margin-bottom: 20px;
  }
  
  .cms-preview-content h2 {
    font-size: 24px;
    margin: 30px 0 15px 0;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 10px;
  }
  
  .cms-preview-content h3 {
    font-size: 20px;
    margin: 25px 0 12px 0;
  }
  
  .cms-preview-content h4 {
    font-size: 18px;
    margin: 20px 0 10px 0;
  }
  
  .cms-preview-content p {
    margin-bottom: 15px;
  }
  
  .cms-preview-content ul,
  .cms-preview-content ol {
    margin-bottom: 15px;
    padding-left: 25px;
  }
  
  .cms-preview-content li {
    margin-bottom: 5px;
  }
  
  .cms-preview-content blockquote {
    border-left: 4px solid #3498db;
    background-color: #f8f9fa;
    padding: 15px 20px;
    margin: 20px 0;
    font-style: italic;
  }
  
  .cms-preview-content code {
    background-color: #f8f9fa;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 14px;
  }
  
  .cms-preview-content pre {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 15px 0;
  }
  
  .cms-preview-content img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 15px 0;
  }
  
  .cms-preview-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  
  .cms-preview-content th,
  .cms-preview-content td {
    border: 1px solid #ecf0f1;
    padding: 12px;
    text-align: left;
  }
  
  .cms-preview-content th {
    background-color: #f8f9fa;
    font-weight: bold;
  }
`;

CMS.registerPreviewStyle(previewStyles, { raw: true });