import React, { useState, useEffect } from 'react';

declare global {
  interface Window { supabase: any; XLSX: any; }
}

const { createClient } = window.supabase;
const supabase = createClient(
  'https://oltninbkpgkygqakxxyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdG5pbmJrcGdreWdxYWt4eHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzQ5NTIsImV4cCI6MjA2NTc1MDk1Mn0.8hUmzENBRiY5HcTxPkzh5JGuDyccRYKv9YzTC0EWSPY'
);

interface Step {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

const WorkflowApp: React.FC = () => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('확인 중...');

  const fetchSteps = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_steps')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setSteps((data || []).map((step: any, i: number) => ({
        ...step,
        sort_order: step.sort_order || i + 1
      })));
      setStatus('연결 성공');
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setStatus('연결 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSteps();

    const subscription = supabase
      .channel('workflow_steps')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'workflow_steps' },
        (payload: any) => {
          if (payload.eventType === 'UPDATE') {
            setSteps(prev => prev.map(step => 
              step.id === payload.new.id ? payload.new as Step : step
            ));
          } else if (payload.eventType === 'DELETE') {
            setSteps(prev => prev.filter(step => step.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  const downloadExcel = () => {
    if (!window.XLSX) {
      alert('엑셀 라이브러리가 로드되지 않았습니다.');
      return;
    }

    const data = steps.length ? steps.map((step, i) => ({
      '순서': i + 1,
      '제목': step.title,
      '설명': step.description,
      '생성일시': new Date(step.created_at).toLocaleString('ko-KR'),
      '수정일시': step.updated_at !== step.created_at ? 
        new Date(step.updated_at).toLocaleString('ko-KR') : '-'
    })) : [{ '순서': 1, '제목': '테스트', '설명': '테스트 데이터', '생성일시': new Date().toLocaleString('ko-KR'), '수정일시': '-' }];

    try {
      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 40 }, { wch: 20 }, { wch: 20 }];
      window.XLSX.utils.book_append_sheet(wb, ws, '워크플로우 단계');
      
      const now = new Date();
      const filename = `워크플로우_${now.toISOString().slice(0, 10).replace(/-/g, '')}_${now.toTimeString().slice(0, 8).replace(/:/g, '')}.xlsx`;
      window.XLSX.writeFile(wb, filename);
      alert('엑셀 다운로드 완료!');
    } catch (error) {
      alert(`다운로드 실패: ${error}`);
    }
  };

  const addStep = async () => {
    if (!newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('workflow_steps')
        .insert([{ title: newTitle.trim(), description: newDesc.trim() || '' }]);

      if (error) throw error;
      setNewTitle('');
      setNewDesc('');
      await fetchSteps();
    } catch (error) {
      alert(`저장 실패: ${error}`);
    }
  };

  const moveStep = async (id: number, currentOrder: number, direction: 'up' | 'down') => {
    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    const targetStep = steps.find(s => s.sort_order === targetOrder);
    if (!targetStep) return;

    try {
      await supabase.from('workflow_steps').update({ sort_order: currentOrder }).eq('id', targetStep.id);
      await supabase.from('workflow_steps').update({ sort_order: targetOrder }).eq('id', id);
      await fetchSteps();
    } catch (error) {
      alert(`이동 실패: ${error}`);
    }
  };

  const updateStep = async (id: number, title: string, description: string) => {
    try {
      const { error } = await supabase
        .from('workflow_steps')
        .update({ title: title.trim(), description: description.trim(), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setEditingStep(null);
    } catch (error) {
      alert('수정 실패');
    }
  };

  const deleteStep = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('workflow_steps').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      alert('삭제 실패');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#333', fontSize: '2em', margin: 0 }}>한성헬시온 제조 프로세스</h1>
        <button style={{ padding: '8px 16px', backgroundColor: '#34a853', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={downloadExcel}>
          📊 엑셀 다운로드
        </button>
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '20px', padding: '10px', backgroundColor: status.includes('성공') ? '#e8f5e8' : '#ffe8e8', borderRadius: '8px', color: status.includes('성공') ? '#2e7d32' : '#d32f2f' }}>
        연결 상태: {status}
      </div>

      {steps.map((step, i) => (
        <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
          <div style={{ backgroundColor: '#4285f4', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>
            {i + 1}
          </div>
          <div style={{ flex: 1 }}>
            {editingStep === step.id ? (
              <EditForm step={step} onSave={updateStep} onCancel={() => setEditingStep(null)} />
            ) : (
              <div style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>{step.title}</h3>
                <p style={{ color: '#666', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '15px' }}>{step.description}</p>
                <div>
                  {[
                    { label: '⬆️', disabled: i === 0, onClick: () => moveStep(step.id, step.sort_order || i + 1, 'up') },
                    { label: '⬇️', disabled: i === steps.length - 1, onClick: () => moveStep(step.id, step.sort_order || i + 1, 'down') },
                    { label: '✏️ 편집', disabled: false, onClick: () => setEditingStep(step.id) },
                    { label: '🗑️ 삭제', disabled: false, onClick: () => deleteStep(step.id) }
                  ].map((btn, idx) => (
                    <button key={idx} style={{ padding: idx < 2 ? '6px 10px' : '8px 16px', margin: '3px', border: 'none', borderRadius: '4px', cursor: btn.disabled ? 'not-allowed' : 'pointer', fontSize: idx < 2 ? '12px' : '14px', backgroundColor: btn.disabled ? '#ccc' : idx < 2 ? '#9aa0a6' : idx === 2 ? '#4285f4' : '#ea4335', color: 'white' }} onClick={btn.onClick} disabled={btn.disabled}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <div style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>🆕 새 단계 추가</h3>
        <input type="text" placeholder="단계 제목을 입력하세요" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', boxSizing: 'border-box' }} />
        <textarea placeholder="단계 설명을 입력하세요" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} style={{ width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }} />
        <button style={{ padding: '8px 16px', margin: '5px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', backgroundColor: '#4285f4', color: 'white' }} onClick={addStep} disabled={!newTitle.trim()}>
          ➕ 단계 추가
        </button>
      </div>
    </div>
  );
};

const EditForm: React.FC<{ step: Step; onSave: (id: number, title: string, desc: string) => void; onCancel: () => void }> = ({ step, onSave, onCancel }) => {
  const [title, setTitle] = useState(step.title);
  const [desc, setDesc] = useState(step.description);

  return (
    <div style={{ backgroundColor: 'white', border: '2px solid #4285f4', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', boxSizing: 'border-box' }} autoFocus placeholder="단계 제목" />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} style={{ width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }} placeholder="단계 설명" />
      <div>
        <button style={{ padding: '8px 16px', margin: '5px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', backgroundColor: '#4285f4', color: 'white' }} onClick={() => title.trim() && onSave(step.id, title, desc)}>💾 저장</button>
        <button style={{ padding: '8px 16px', margin: '5px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', backgroundColor: '#f1f3f4', color: '#333' }} onClick={onCancel}>❌ 취소</button>
      </div>
    </div>
  );
};

export default WorkflowApp;