import { describe, it, expect } from 'vitest';
import {
  INITIAL_CERTIFICATE_DATA,
  addStudentToData,
  removeStudentFromData,
  addInstructorToData,
  removeInstructorFromData,
  addCurriculumItemToData,
  updateCurriculumItemInData,
  removeCurriculumItemFromData,
  setTotalHoursManualInData,
  toggleBoldVariableInData
} from '../hooks/useCertificateData';
import { CertificateData } from '../types';

describe('G04-B: Gerenciamento Centralizado de Estado e Transformações de Domínio', () => {
  it('INITIAL_CERTIFICATE_DATA deve ter valores padrão consistentes', () => {
    expect(INITIAL_CERTIFICATE_DATA.students).toEqual([]);
    expect(INITIAL_CERTIFICATE_DATA.instructors).toEqual([]);
    expect(INITIAL_CERTIFICATE_DATA.curriculum).toEqual([]);
    expect(INITIAL_CERTIFICATE_DATA.totalHours).toBe('0');
    expect(INITIAL_CERTIFICATE_DATA.workloadMode).toBe('auto');
    expect(INITIAL_CERTIFICATE_DATA.showHoursColumn).toBe(true);
    expect(INITIAL_CERTIFICATE_DATA.frontBorderWidth).toBe(16);
  });

  it('addStudentToData deve incluir aluno formatado e não mutar o estado original', () => {
    const initial = INITIAL_CERTIFICATE_DATA;
    const { data: updated, newStudent } = addStudentToData(initial, 'Maria Silva', '529.982.247-25');

    expect(initial.students.length).toBe(0);
    expect(updated.students.length).toBe(1);
    expect(newStudent.name).toBe('Maria Silva');
    expect(newStudent.cpf).toBe('529.982.247-25');
    expect(newStudent.displayName).toBe('Maria Silva');
    expect(updated.students[0].id).toBeDefined();
  });

  it('removeStudentFromData deve filtrar aluno por id', () => {
    const { data: with1, newStudent: s1 } = addStudentToData(INITIAL_CERTIFICATE_DATA, 'Aluno 1', '529.982.247-25');
    const { data: with2, newStudent: s2 } = addStudentToData(with1, 'Aluno 2', '714.287.938-60');

    expect(with2.students.length).toBe(2);

    const afterRemoval = removeStudentFromData(with2, s1.id);
    expect(afterRemoval.students.length).toBe(1);
    expect(afterRemoval.students[0].id).toBe(s2.id);
  });

  it('addInstructorToData deve adicionar instrutores e respeitar o limite máximo de 4', () => {
    let state = INITIAL_CERTIFICATE_DATA;

    const r1 = addInstructorToData(state, 'Inst 1', 'Comp 1');
    expect(r1.error).toBeUndefined();
    state = r1.data;

    const r2 = addInstructorToData(state, 'Inst 2', 'Comp 2');
    state = r2.data;

    const r3 = addInstructorToData(state, 'Inst 3', 'Comp 3');
    state = r3.data;

    const r4 = addInstructorToData(state, 'Inst 4', 'Comp 4');
    state = r4.data;

    expect(state.instructors.length).toBe(4);

    // 5º instrutor deve ser bloqueado
    const r5 = addInstructorToData(state, 'Inst 5', 'Comp 5');
    expect(r5.error).toContain('Limite atingido');
    expect(r5.data.instructors.length).toBe(4);
  });

  it('removeInstructorFromData deve remover instrutor por id', () => {
    const r1 = addInstructorToData(INITIAL_CERTIFICATE_DATA, 'Inst A', 'Comp A');
    const instId = r1.data.instructors[0].id;
    const after = removeInstructorFromData(r1.data, instId);
    expect(after.instructors.length).toBe(0);
  });

  it('no modo automático, adicionar/editar/remover matéria recalcula totalHours', () => {
    let state = INITIAL_CERTIFICATE_DATA;
    expect(state.workloadMode).toBe('auto');

    // Adiciona matéria 1: 20h
    state = addCurriculumItemToData(state, { id: 'm1', subject: 'Matéria 1', hours: 20 });
    expect(state.curriculum.length).toBe(1);
    expect(state.totalHours).toBe('20');

    // Adiciona matéria 2: 30h
    state = addCurriculumItemToData(state, { id: 'm2', subject: 'Matéria 2', hours: 30 });
    expect(state.totalHours).toBe('50');

    // Atualiza matéria 1 para 40h
    state = updateCurriculumItemInData(state, 'm1', { hours: 40 });
    expect(state.totalHours).toBe('70'); // 40 + 30

    // Remove matéria 2
    state = removeCurriculumItemFromData(state, 'm2');
    expect(state.totalHours).toBe('40');
  });

  it('no modo manual, adicionar matérias preserva o total informado sem sobrescrita silenciosa', () => {
    let state = INITIAL_CERTIFICATE_DATA;
    // Operador define manualmente 100h
    state = setTotalHoursManualInData(state, '100');
    expect(state.workloadMode).toBe('manual');
    expect(state.totalHours).toBe('100');

    // Adiciona matéria de 25h: totalHours permanece 100
    state = addCurriculumItemToData(state, { id: 'm1', subject: 'Matéria 1', hours: 25 });
    expect(state.totalHours).toBe('100');

    // Atualiza matéria: totalHours permanece 100
    state = updateCurriculumItemInData(state, 'm1', { hours: 35 });
    expect(state.totalHours).toBe('100');
  });

  it('toggleBoldVariableInData deve alternar a variável em negrito', () => {
    let state = INITIAL_CERTIFICATE_DATA;
    expect(state.boldVariables).toEqual([]);

    state = toggleBoldVariableInData(state, '{{NOME}}');
    expect(state.boldVariables).toContain('{{NOME}}');

    state = toggleBoldVariableInData(state, '{{NOME}}');
    expect(state.boldVariables).not.toContain('{{NOME}}');
  });
});
