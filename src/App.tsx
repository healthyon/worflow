// App.tsx - 단순화된 Supabase 실시간 워크플로우 앱
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
  const [isOnline, setIsOnline] = useState(true);

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

    // 실시간 구독
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
      .subscribe((status: string) => {
        console.log('구독 상태:', status);
        setIsOnline(status === 'SUBSCRIBED');
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  // 엑셀 다운로드 함수
  const downloadExcel = () => {
    // SheetJS 라이브러리 확인
    if (!window.XLSX) {
      alert('엑셀 라이브러리가 로드되지 않았습니다. 페이지를 새로고침하거나 배포된 사이트에서 이용해주세요.');
      return;
    }

    try {
      // 엑셀 데이터 준비
      const excelData = steps.map((step, index) => ({
        '순서': index + 1,
        '제목': step.title,
        '설명': step.description,
        '생성일시': new Date(step.created_at).toLocaleString('ko-KR'),
        '수정일시': step.updated_at !== step.created_at ? 
          new Date(step.updated_at).toLocaleString('ko-KR') : '-'
      }));

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

      // 파일 다운로드
      window.XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다. 페이지를 새로고침하고 다시 시도해주세요.');
    }
  };
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

  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  const titleStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
    fontSize: '2em'
  };

  const statusStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: isOnline ? '#e8f5e8' : '#ffe8e8',
    color: isOnline ? '#2e7d32' : '#d32f2f'
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const stepContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    marginBottom: '15px'
  };

  const stepNumberStyle: React.CSSProperties = {
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
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    margin: '5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#4285f4',
    color: 'white'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f1f3f4',
    color: '#333'
  };

  const dangerButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#ea4335',
    color: 'white'
  };

  const successButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    margin: '5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: '#34a853',
    color: 'white'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    margin: '5px 0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box'
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit'
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🚀 실시간 워크플로우</h1>
      


      <div>
        {steps.map((step, index) => (
          <div key={step.id} style={stepContainerStyle}>
            <div style={stepNumberStyle}>
              {index + 1}
            </div>
            
            <div style={{ flex: 1 }}>
              {editingStep === step.id ? (
                <EditStepForm 
                  step={step}
                  onSave={updateStep}
                  onCancel={() => setEditingStep(null)}
                  inputStyle={inputStyle}
                  textareaStyle={textareaStyle}
                  primaryButtonStyle={primaryButtonStyle}
                  secondaryButtonStyle={secondaryButtonStyle}
                />
              ) : (
                <div style={cardStyle}>
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
                      style={primaryButtonStyle}
                      onClick={() => setEditingStep(step.id)}
                    >
                      ✏️ 편집
                    </button>
                    <button 
                      style={dangerButtonStyle}
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
        <div style={cardStyle}>
          <h3>🆕 새 단계 추가</h3>
          <input
            type="text"
            placeholder="단계 제목을 입력하세요"
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            style={inputStyle}
          />
          <textarea
            placeholder="단계 설명을 입력하세요"
            value={newStepDescription}
            onChange={(e) => setNewStepDescription(e.target.value)}
            style={textareaStyle}
          />
          <button 
            style={primaryButtonStyle} 
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
  inputStyle: React.CSSProperties;
  textareaStyle: React.CSSProperties;
  primaryButtonStyle: React.CSSProperties;
  secondaryButtonStyle: React.CSSProperties;
}

const EditStepForm: React.FC<EditStepFormProps> = ({ 
  step, onSave, onCancel, inputStyle, textareaStyle, primaryButtonStyle, secondaryButtonStyle 
}) => {
  const [title, setTitle] = useState(step.title);
  const [description, setDescription] = useState(step.description);

  const handleSave = () => {
    if (title.trim()) {
      onSave(step.id, title, description);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
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
      <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
        팁: Ctrl+Enter로 저장, Esc로 취소
      </div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyPress}
        style={inputStyle}
        autoFocus
        placeholder="단계 제목"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyPress}
        style={textareaStyle}
        placeholder="단계 설명"
      />
      <div>
        <button style={primaryButtonStyle} onClick={handleSave}>
          💾 저장
        </button>
        <button style={secondaryButtonStyle} onClick={onCancel}>
          ❌ 취소
        </button>
      </div>
    </div>
  );
};

export default WorkflowApp;