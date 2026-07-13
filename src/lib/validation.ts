import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback = '操作失败，请重试'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          detail?: string | Array<{ msg?: string }>;
          error?: { message?: string; details?: Array<{ field?: string; message?: string }> };
        }
      | undefined;

    if (typeof data?.error?.message === 'string') {
      const firstDetail = data.error.details?.[0]?.message;
      return firstDetail ? `${data.error.message}：${firstDetail}` : data.error.message;
    }
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail)) {
      const first = data.detail[0];
      if (typeof first === 'object' && first && 'msg' in first) {
        return String((first as { msg: string }).msg);
      }
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_REGEX = /^[\w\u4e00-\u9fa5]{2,30}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return '请输入邮箱地址';
  if (!EMAIL_REGEX.test(email)) return '请输入有效的邮箱地址';
  return undefined;
}

export function validateUsername(username: string): string | undefined {
  if (!username.trim()) return '请输入用户名';
  if (username.length < 2 || username.length > 30) return '用户名长度为 2-30 个字符';
  if (!USERNAME_REGEX.test(username)) return '用户名只能包含字母、数字、下划线和中文';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return '请输入密码';
  if (!PASSWORD_REGEX.test(password)) return '密码至少 8 位，需包含大写字母、小写字母和数字';
  return undefined;
}

export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return 1;
  if (score === 3) return 2;
  if (score === 4) return 3;
  return 4;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const AGENT_NAME_REGEX = /^[\w\u4e00-\u9fa5\s-]{1,50}$/;

export function validateAgentName(name: string): string | undefined {
  if (!name.trim()) return '请输入 Agent 名称';
  if (name.length > 50) return '名称不超过 50 个字符';
  if (!AGENT_NAME_REGEX.test(name.trim())) {
    return '名称只能包含中英文、数字、空格、下划线和短横线';
  }
  return undefined;
}

export function validateAgentDescription(description: string): string | undefined {
  if (!description.trim()) return '请输入描述';
  if (description.length > 200) return '描述不超过 200 个字符';
  return undefined;
}

export function validateSystemPrompt(prompt: string): string | undefined {
  if (!prompt.trim()) return '请输入角色描述';
  if (prompt.trim().length < 10) return '角色描述至少 10 个字符';
  if (prompt.length > 10000) return '角色描述不超过 10000 个字符';
  return undefined;
}

export function validateToolName(name: string): string | undefined {
  if (!name.trim()) return '请输入工具名称';
  if (name.length > 50) return '名称不超过 50 个字符';
  return undefined;
}

export function validateToolDescription(description: string): string | undefined {
  if (!description.trim()) return '请输入描述';
  if (description.length > 200) return '描述不超过 200 个字符';
  return undefined;
}

export function validateApiUrl(url: string): string | undefined {
  if (!url.trim()) return '请输入有效的 API 地址';
  const full = url.startsWith('http') ? url : `https://${url}`;
  try {
    new URL(full);
    return undefined;
  } catch {
    return '请输入有效的 API 地址';
  }
}

export function formatTokenCount(n: number): string {
  return n.toLocaleString('zh-CN');
}

export function formatCost(cost: number): string {
  return `¥${cost.toFixed(cost < 1 ? 3 : 2)}`;
}
