import React, { useState } from "react";

// 간단한 아이콘 컴포넌트들
const ChevronUp = () => <span style={{ fontSize: "14px" }}>↑</span>;
const ChevronDown = () => <span style={{ fontSize: "14px" }}>↓</span>;
const Edit2 = () => <span style={{ fontSize: "14px" }}>✏️</span>;
const Trash2 = () => <span style={{ fontSize: "14px" }}>🗑️</span>;
const Save = () => <span style={{ fontSize: "14px" }}>💾</span>;
const X = () => <span style={{ fontSize: "14px" }}>✖️</span>;
const Plus = () => <span style={{ fontSize: "16px" }}>➕</span>;

const WorkflowEditor = () => {
  const [steps, setSteps] = useState([
    {
      id: 1,
      title: "고객사 컨설팅",
      description: "전문 상담을 통한 맞춤형 솔루션 제공",
    },
    { id: 2, title: "의뢰접수", description: "고객 요구사항 접수 및 분석" },
    { id: 3, title: "배합비 검토", description: "최적의 성분 배합비 설계" },
    { id: 4, title: "제제연구", description: "전문 연구팀의 제제 개발" },
    { id: 5, title: "샘플 제작", description: "고객 확인용 샘플 생산" },
    { id: 6, title: "시생산", description: "본격 생산 전 시험 생산" },
    {
      id: 7,
      title: "공인성적 및 디자인",
      description: "품질 검증 및 패키지 디자인",
    },
    { id: 8, title: "품목신고", description: "식약처 품목 신고 지원" },
    { id: 9, title: "포장개발", description: "최적화된 포장재 개발" },
    { id: 10, title: "광고심의", description: "광고 소재 심의 지원" },
    {
      id: 11,
      title: "원부자재 발주 및 입고",
      description: "고품질 원료 조달 관리",
    },
    { id: 12, title: "생산 및 검수", description: "엄격한 품질관리 하 생산" },
    { id: 13, title: "제품 납품", description: "안전한 완제품 배송" },
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const moveStep = (index: number, direction: "up" | "down") => {
    const newSteps = [...steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [
        newSteps[targetIndex],
        newSteps[index],
      ];

      newSteps.forEach((step, idx) => {
        step.id = idx + 1;
      });

      setSteps(newSteps);
    }
  };

  const startEdit = (step: any) => {
    setEditingId(step.id);
    setEditTitle(step.title);
    setEditDescription(step.description);
  };

  const saveEdit = () => {
    setSteps(
      steps.map((step) =>
        step.id === editingId
          ? { ...step, title: editTitle, description: editDescription }
          : step
      )
    );
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const deleteStep = (id: number) => {
    const newSteps = steps.filter((step) => step.id !== id);
    newSteps.forEach((step, idx) => {
      step.id = idx + 1;
    });
    setSteps(newSteps);
  };

  const addStep = () => {
    if (newTitle.trim() && newDescription.trim()) {
      const newStep = {
        id: steps.length + 1,
        title: newTitle.trim(),
        description: newDescription.trim(),
      };
      setSteps([...steps, newStep]);
      setNewTitle("");
      setNewDescription("");
      setIsAdding(false);
    }
  };

  const cancelAdd = () => {
    setNewTitle("");
    setNewDescription("");
    setIsAdding(false);
  };

  // 스타일 객체들
  const containerStyle: React.CSSProperties = {
    maxWidth: "896px",
    margin: "0 auto",
    padding: "24px",
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    padding: "24px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "1.875rem",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "32px",
    color: "#1f2937",
  };

  const stepContainerStyle: React.CSSProperties = {
    position: "relative",
    marginBottom: "16px",
  };

  const connectionLineStyle: React.CSSProperties = {
    position: "absolute",
    left: "24px",
    top: "64px",
    width: "2px",
    height: "32px",
    backgroundColor: "#93c5fd",
    zIndex: 0,
  };

  const stepCardStyle: React.CSSProperties = {
    background: "linear-gradient(to right, #eff6ff, #e0e7ff)",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    position: "relative",
    zIndex: 10,
    transition: "all 0.2s",
  };

  const stepContentStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
  };

  const stepNumberStyle: React.CSSProperties = {
    width: "48px",
    height: "48px",
    backgroundColor: "#3b82f6",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "18px",
    flexShrink: 0,
  };

  const stepInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const stepTitleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  };

  const stepDescriptionStyle: React.CSSProperties = {
    color: "#6b7280",
    fontSize: "14px",
    whiteSpace: "pre-wrap",
  };

  const controlsStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const controlRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "4px",
  };

  const controlBtnStyle: React.CSSProperties = {
    padding: "4px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#6b7280",
    transition: "all 0.2s",
  };

  const editFormStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "none",
    fontFamily: "inherit",
  };

  const buttonRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "8px",
  };

  const saveBtnStyle: React.CSSProperties = {
    padding: "4px 12px",
    backgroundColor: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "14px",
  };

  const cancelBtnStyle: React.CSSProperties = {
    padding: "4px 12px",
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "14px",
  };

  const addStepCardStyle: React.CSSProperties = {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  };

  const addStepBtnStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px",
    border: "2px dashed #d1d5db",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "#6b7280",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "16px",
    transition: "all 0.2s",
  };

  const greenNumberStyle: React.CSSProperties = {
    ...stepNumberStyle,
    backgroundColor: "#22c55e",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>한성헬시온 제조 프로세스</h1>

        <div>
          {steps.map((step, index) => (
            <div key={step.id} style={stepContainerStyle}>
              {/* 연결선 */}
              {index < steps.length - 1 && (
                <div style={connectionLineStyle}></div>
              )}

              <div style={stepCardStyle}>
                <div style={stepContentStyle}>
                  {/* 단계 번호 */}
                  <div style={stepNumberStyle}>{step.id}</div>

                  {/* 내용 */}
                  <div style={stepInfoStyle}>
                    {editingId === step.id ? (
                      <div style={editFormStyle}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={inputStyle}
                          placeholder="단계 제목"
                        />
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          style={textareaStyle}
                          rows={2}
                          placeholder="단계 설명"
                        />
                        <div style={buttonRowStyle}>
                          <button onClick={saveEdit} style={saveBtnStyle}>
                            <Save /> 저장
                          </button>
                          <button onClick={cancelEdit} style={cancelBtnStyle}>
                            <X /> 취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 style={stepTitleStyle}>{step.title}</h3>
                        <p style={stepDescriptionStyle}>{step.description}</p>
                      </div>
                    )}
                  </div>

                  {/* 컨트롤 버튼 */}
                  {editingId !== step.id && (
                    <div style={controlsStyle}>
                      <div style={controlRowStyle}>
                        <button
                          onClick={() => moveStep(index, "up")}
                          disabled={index === 0}
                          style={{
                            ...controlBtnStyle,
                            opacity: index === 0 ? 0.3 : 1,
                            cursor: index === 0 ? "not-allowed" : "pointer",
                          }}
                        >
                          <ChevronUp />
                        </button>
                        <button
                          onClick={() => moveStep(index, "down")}
                          disabled={index === steps.length - 1}
                          style={{
                            ...controlBtnStyle,
                            opacity: index === steps.length - 1 ? 0.3 : 1,
                            cursor:
                              index === steps.length - 1
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          <ChevronDown />
                        </button>
                      </div>

                      <div style={controlRowStyle}>
                        <button
                          onClick={() => startEdit(step)}
                          style={controlBtnStyle}
                        >
                          <Edit2 />
                        </button>
                        <button
                          onClick={() => deleteStep(step.id)}
                          style={controlBtnStyle}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 새 단계 추가 */}
          {isAdding ? (
            <div style={stepContainerStyle}>
              <div style={addStepCardStyle}>
                <div style={stepContentStyle}>
                  <div style={greenNumberStyle}>{steps.length + 1}</div>
                  <div style={stepInfoStyle}>
                    <div style={editFormStyle}>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        style={inputStyle}
                        placeholder="새 단계 제목을 입력하세요"
                      />
                      <textarea
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        style={textareaStyle}
                        rows={2}
                        placeholder="새 단계 설명을 입력하세요"
                      />
                      <div style={buttonRowStyle}>
                        <button onClick={addStep} style={saveBtnStyle}>
                          <Save /> 추가
                        </button>
                        <button onClick={cancelAdd} style={cancelBtnStyle}>
                          <X /> 취소
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsAdding(true)} style={addStepBtnStyle}>
              <Plus /> 새 단계 추가
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;
