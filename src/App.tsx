// App.tsx - 디버깅용 단순화 버전
import React, { useState, useEffect } from 'react';
declare global {
  interface Window {
    supabase: any;
    XLSX: any;
  }
}

const { createClient } = window.supabase;

// Supabase 설정 (실제 값으로 교체해야 함)
const supabaseUrl = 'https://oltninbkpgkygqakxxyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdG5pbmJrcGdreWdxYWt4eHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzQ5NTIsImV4cCI6MjA2NTc1MDk1Mn0.8hUmzENBRiY5HcTxPkzh5JGuDyccRYKv9YzTC0EWSPY';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Step {
  id: number;
  title: string;
  description: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

const WorkflowApp: React.FC = () => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [loading, setLoading] = useState(true);

  console.log("App 렌더링됨, 단계 수:", steps.length);

  // 데이터 불러오기
  const fetchSteps = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_steps')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSteps(data || []);
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 실시간 구독 설정
  useEffect(() => {
    fetchSteps();

    const subscription = supabase
      .channel('workflow_steps')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'workflow_steps' },
        (payload: any) => {
          console.log('실시간 변경 감지:', payload);
          
          if (payload.eventType === 'INSERT') {
            setSteps(prev => [...prev, payload.new as Step]);
          } else if (payload.eventType === 'UPDATE') {
            setSteps(prev => prev.map(step => 
              step.id === payload.new.id ? payload.new as Step : step
            ));
          } else if (payload.eventType === 'DELETE') {
            setSteps(prev => prev.filter(step => step.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 엑셀 다운로드 함수
  const downloadExcel = () => {
    // 단계별 디버깅
    console.log('다운로드 시작');
    console.log('XLSX 사용 가능:', !!window.XLSX);
    console.log('단계 수:', steps.length);
    
    // SheetJS 라이브러리 확인
    if (!window.XLSX) {
      alert('엑셀 라이브러리가 로드되지 않았습니다.\n\n해결 방법:\n1. 페이지 새로고침\n2. public/index.html에 CDN 추가 확인\n3. 브라우저 캐시 삭제');
      return;
    }

    // 데이터가 없으면 기본 데이터로 테스트
    let excelData;
    if (steps.length === 0) {
      excelData = [{
        '순서': 1,
        '제목': '테스트 단계',
        '설명': '엑셀 다운로드 테스트용 데이터입니다.',
        '생성일시': new Date().toLocaleString('ko-KR'),
        '수정일시': '-'
      }];
    } else {
      excelData = steps.map((step, index) => ({
        '순서': index + 1,
        '제목': step.title,
        '설명': step.description,
        '생성일시': new Date(step.created_at).toLocaleString('ko-KR'),
        '수정일시': step.updated_at !== step.created_at ? 
          new Date(step.updated_at).toLocaleString('ko-KR') : '-'
      }));
    }

    try {
      console.log('엑셀 데이터:', excelData);
      
      // 워크북과 워크시트 생성
      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.json_to_sheet(excelData);

      // 컬럼 너비 설정
      ws['!cols'] = [
        { wch: 8 },   // 순서
        { wch: 25 },  // 제목
        { wch: 40 },  // 설명
        { wch: 20 },  // 생성일시
        { wch: 20 }   // 수정일시
      ];

      // 워크시트를 워크북에 추가
      window.XLSX.utils.book_append_sheet(wb, ws, '워크플로우 단계');

      // 파일명 생성 (현재 날짜 포함)
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const filename = `워크플로우_${dateStr}_${timeStr}.xlsx`;

      console.log('파일명:', filename);

      // 파일 다운로드
      window.XLSX.writeFile(wb, filename);
      
      console.log('다운로드 완료');
      alert('엑셀 파일 다운로드 완료!');
      
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`엑셀 다운로드 실패:\n${errorMessage}\n\n브라우저 콘솔을 확인해주세요.`);
    }
  };

  // 새 단계 추가
  const addStep = async () => {
    if (!newStepTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('workflow_steps')
        .insert([
          {
            title: newStepTitle.trim(),
            description: newStepDescription.trim(),
            is_completed: false
          }
        ]);

      if (error) throw error;

      setNewStepTitle('');
      setNewStepDescription('');
    } catch (error) {
      console.error('단계 추가 실패:', error);
      alert('단계 추가에 실패했습니다.');
    }
  };

  // 단계 수정
  const updateStep = async (id: number, title: string, description: string) => {
    try {
      const { error } = await supabase
        .from('workflow_steps')
        .update({
          title: title.trim(),
          description: description.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      setEditingStep(null);
    } catch (error) {
      console.error('단계 수정 실패:', error);
      alert('단계 수정에 실패했습니다.');
    }
  };

  // 단계 삭제
  const deleteStep = async (id: number) => {
    if (!window.confirm('정말로 이 단계를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('workflow_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('단계 삭제 실패:', error);
      alert('단계 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '18px' }}>데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* 제목과 다운로드 버튼을 같은 줄에 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px' 
      }}>
        <h1 style={{ 
          color: '#333', 
          fontSize: '2em', 
          margin: 0 
        }}>
          한성헬시온 제조 프로세스
        </h1>
        
        <button 
          style={{
            padding: '8px 16px',
            backgroundColor: '#34a853',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
          onClick={downloadExcel}
        >
          📊 엑셀 다운로드
        </button>
      </div>

      <div>
        {steps.map((step, index) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
            <div style={{
              backgroundColor: '#4285f4',
              color: 'white',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '18px',
              flexShrink: 0
            }}>
              {index + 1}
            </div>
            
            <div style={{ flex: 1 }}>
              {editingStep === step.id ? (
                <EditStepForm 
                  step={step}
                  onSave={updateStep}
                  onCancel={() => setEditingStep(null)}
                />
              ) : (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '15px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ 
                    color: '#666', 
                    lineHeight: '1.6', 
                    whiteSpace: 'pre-wrap',
                    marginBottom: '15px'
                  }}>
                    {step.description}
                  </p>
                  
                  <div>
                    <button 
                      style={{
                        padding: '8px 16px',
                        margin: '5px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        backgroundColor: '#4285f4',
                        color: 'white'
                      }}
                      onClick={() => setEditingStep(step.id)}
                    >
                      ✏️ 편집
                    </button>
                    <button 
                      style={{
                        padding: '8px 16px',
                        margin: '5px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        backgroundColor: '#ea4335',
                        color: 'white'
                      }}
                      onClick={() => deleteStep(step.id)}
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 새 단계 추가 */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '15px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>🆕 새 단계 추가</h3>
          <input
            type="text"
            placeholder="단계 제목을 입력하세요"
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              margin: '5px 0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
          <textarea
            placeholder="단계 설명을 입력하세요"
            value={newStepDescription}
            onChange={(e) => setNewStepDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              margin: '5px 0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box',
              minHeight: '80px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <button 
            style={{
              padding: '8px 16px',
              margin: '5px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              backgroundColor: '#4285f4',
              color: 'white'
            }}
            onClick={addStep}
            disabled={!newStepTitle.trim()}
          >
            ➕ 단계 추가
          </button>
        </div>
      </div>
    </div>
  );
};

// 편집 폼 컴포넌트
interface EditStepFormProps {
  step: Step;
  onSave: (id: number, title: string, description: string) => void;
  onCancel: () => void;
}

const EditStepForm: React.FC<EditStepFormProps> = ({ step, onSave, onCancel }) => {
  const [title, setTitle] = useState(step.title);
  const [description, setDescription] = useState(step.description);

  const handleSave = () => {
    if (title.trim()) {
      onSave(step.id, title, description);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      border: '2px solid #4285f4',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          margin: '5px 0',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '16px',
          boxSizing: 'border-box'
        }}
        autoFocus
        placeholder="단계 제목"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          margin: '5px 0',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '16px',
          boxSizing: 'border-box',
          minHeight: '80px',
          resize: 'vertical',
          fontFamily: 'inherit'
        }}
        placeholder="단계 설명"
      />
      <div>
        <button 
          style={{
            padding: '8px 16px',
            margin: '5px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            backgroundColor: '#4285f4',
            color: 'white'
          }}
          onClick={handleSave}
        >
          💾 저장
        </button>
        <button 
          style={{
            padding: '8px 16px',
            margin: '5px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            backgroundColor: '#f1f3f4',
            color: '#333'
          }}
          onClick={onCancel}
        >
          ❌ 취소
        </button>
      </div>
    </div>
  );
};

export default WorkflowApp;