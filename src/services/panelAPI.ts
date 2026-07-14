import axios from 'axios';
import BASE_URL from '../Config';

const api = axios.create({ baseURL: BASE_URL });

export interface PanelMember {
  id: number;
  name: string;
  email: string;
  employee_id: string;
  designation: string;
  skills: string[];
  department: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface PanelMemberForm {
  name: string;
  email: string;
  employee_id: string;
  designation: string;
  skills: string[];
  department: string;
  status: 'active' | 'inactive';
}

export const panelAPI = {
  getAll:   (params?: { department?: string; status?: string; search?: string }) =>
    api.get('/api/panel-members', { params }).then(r => r.data),

  create:   (data: PanelMemberForm) =>
    api.post('/api/panel-members', data).then(r => r.data),

  update:   (id: number | string, data: PanelMemberForm) =>
    api.put(`/api/panel-members/${id}`, data).then(r => r.data),

  updateStatus: (id: number | string, status: 'active' | 'inactive') =>
    api.patch(`/api/panel-members/${id}/status`, { status }).then(r => r.data),

  delete:   (id: number | string) =>
    api.delete(`/api/panel-members/${id}`).then(r => r.data),
};

export default panelAPI;
