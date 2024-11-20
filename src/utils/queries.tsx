import { useMutation, UseMutationResult, useQuery } from 'react-query';
import { ComplianceEnum, CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet } from './snippet.ts';
import { PaginatedUsers } from "./users.ts";
import { TestCase } from "../types/TestCase.ts";
import { FileType } from "../types/FileType.ts";
import { Rule } from "../types/Rule.ts";
import { useAuth0 } from "@auth0/auth0-react";
import { paginationParams } from './pagination.ts';


export const useSnippetsOperations = () => {
  const { getAccessTokenSilently } = useAuth0();
  const backendUrl = process.env.BACKEND_URL;




  const fetchWithAuth = async (url: string, options: RequestInit = {}, isString?: boolean) => {
    const token = await getAccessTokenSilently();
    localStorage.setItem('authAccessToken', token);
    const response = await fetch(`${backendUrl}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    if (isString) {
      return response.text();
    } return response.json();
  };

  const createSnippet = async (newSnippet: CreateSnippet): Promise<Snippet> => {
    const body = {
      title: newSnippet.name,
      language: newSnippet.language,
      extension: newSnippet.extension,
      code: newSnippet.content
    }
    const snippet = await fetchWithAuth('/snippet/save', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return getSnippet(snippet, getCompliance(snippet));
  };

  const updateSnippet = async ({ id, updateSnippet }: { id: string; updateSnippet: UpdateSnippet }): Promise<Snippet> => {
    const snippet: Snippet = await getSnippetById(id);
    const body = {
      snippetId: id,
      title: snippet.name,
      language: snippet.language,
      extension: snippet.extension,
      code: updateSnippet.content
    }
    const response = await fetchWithAuth('/snippet/update', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return getSnippet(response, getCompliance(response));
  };

  function getCompliance(snippet: {
    author: string;
    id: string;
    title: string;
    language: string;
    extension: string;
    code: string;
    lintStatus: string
  }) {
    let compliance: ComplianceEnum = 'pending';
    switch (snippet.lintStatus) {
      case 'COMPLIANT':
        compliance = 'compliant';
        break;
      case 'NON_COMPLIANT':
        compliance = 'not-compliant';
        break;
      case 'UNKNOWN':
        compliance = 'failed';
        break;
      case 'IN_PROGRESS':
        compliance = 'pending';
        break;
      default:
        return 'pending';
    }
    return compliance;
  }

  function getSnippet(snippet: {
    author: string;
    id: string;
    title: string;
    language: string;
    extension: string;
    code: string;
    lintStatus: string
  }, compliance: ComplianceEnum): Snippet {
    return {
      id: snippet.id,
      name: snippet.title,
      content: snippet.code,
      language: snippet.language,
      extension: snippet.extension,
      compliance: compliance,
      author: snippet.author
    };
  }

  const getSnippets = async (page: number = 0, pageSize: number = 10, snippetName?: string): Promise<PaginatedSnippets> => {
    const response = await fetchWithAuth(`/snippet/get/all?relation=ALL&${paginationParams(page, pageSize)}&prefix=${snippetName}`);

    const snippets: Snippet[] = response.map((snippet: { author: string; id: string; title: string; language: string; extension: string; code: string; lintStatus: string; }) => {
      const compliance = getCompliance(snippet);
      return getSnippet(snippet, compliance);
    });

    const paginatedSnippets: PaginatedSnippets = {
      page: page,
      page_size: pageSize,
      count: snippets.length,
      snippets: snippets
    };
    console.log('paginatedSnippets:', paginatedSnippets);
    return paginatedSnippets;
  };

  const getSnippetById = async (id: string): Promise<Snippet> => {
    const response = await fetchWithAuth(`/snippet/details?snippetId=${id}`);
    return getSnippet(response, getCompliance(response));
  }

  const getUserFriends = async (name: string = "", page: number = 0, pageSize: number = 10): Promise<PaginatedUsers> => {
    return await fetchWithAuth(`/snippet/get/users?prefix=${name}&${paginationParams(page, pageSize)}`);
  };

  const shareSnippet = async ({ snippetId, name }: { snippetId: string; name: string }): Promise<Snippet> => {
    const response = await fetchWithAuth('/snippet/share', {
      method: 'POST',
      body: JSON.stringify({ snippetId, username: name })
    });
    return getSnippet(response, getCompliance(response));
  };

  const getTestCases = async (id: string): Promise<TestCase[]> => {
    const response = await fetchWithAuth('/test/get-all?snippetId=' + id);
    const testCases: TestCase[] = response.map((tc: { id: string; title: string; inputQueue: string[]; outputQueue: string[]; }) => {
      return {
        id: tc.id,
        name: tc.title,
        input: tc.inputQueue.length === 0 ? null : tc.inputQueue,
        output: tc.outputQueue.length === 0 ? null : tc.outputQueue
      };
    });
    return testCases;
  };

  const postTestCase = async (tc: Partial<TestCase>): Promise<TestCase> => {
    console.log('tc:', tc);
    const body = {
      id: tc.id,
      title: tc.name,
      inputQueue: tc.input,
      outputQueue: tc.output
    };

    return await fetchWithAuth('/test/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  };

  const removeTestCase = async (id: string): Promise<string> => {
    return await fetchWithAuth(`/test/delete?testId=${id}`, {
      method: 'DELETE'
    });
  };

  const testSnippet = async (tc: Partial<TestCase>): Promise<TestCaseResult> => {
    const body = {
      id: tc.id,
      title: tc.name,
      inputQueue: tc.input,
      outputQueue: tc.output
    };

    try {
      await fetchWithAuth('/test/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }, true);

      return "success";

    } catch (error) {
      console.error('Error testing snippet:', error);
      return "fail";
    }
  };

  const jsonToRules = (json: { [key: string]: string | number | boolean }): Rule[] => {
    return Object.keys(json).map((key, index) => {
      const value = json[key];
      return {
        id: index.toString(),
        name: key,
        isActive: typeof value === 'boolean' ? value : true,
        value: typeof value !== 'boolean' ? value : null
      };
    });
  };

  const rulesToJson = (rules: Rule[]): { [key: string]: string | number | boolean } => {
    const result = rules.reduce((acc: { [key: string]: string | number | boolean }, rule) => {
      console.log('rule:', rule);
      if (rule.isActive && rule.value !== null && rule.value !== undefined) {
        acc[rule.name] = rule.value;
      } else if (rule.value === null || rule.value === undefined) {
        acc[rule.name] = rule.isActive;
      }
      return acc;
    }, {} as { [key: string]: string | number | boolean });
    console.log('result:', result);
    return result;
  };

  const getFormatRules = async (): Promise<Rule[]> => {
    const response = await fetchWithAuth('/format');
    return jsonToRules(response);
  };

  const modifyFormatRule = async (rule: Rule[]): Promise<Rule[]> => {
    return await fetchWithAuth('/format', {
      method: 'PUT',
      body: JSON.stringify(rulesToJson(rule))
    });
  };

  const getLintingRules = async (): Promise<Rule[]> => {
    const response = await fetchWithAuth('/lint');
    return jsonToRules(response);
  };

  const modifyLintingRule = async (rule: Rule[]): Promise<Rule[]> => {
    return await fetchWithAuth('/lint', {
      method: 'PUT',
      body: JSON.stringify(rulesToJson(rule))
    });
  };

  const formatSnippet = async (id: string): Promise<string> => {
    return await fetchWithAuth('/snippet/get/formatted?snippetId=' + id, {}, true);
  };

  const deleteSnippet = async (id: string): Promise<string> => {
    const response =  await fetchWithAuth(`/snippet/delete?snippetId=${id}`, {
      method: 'DELETE'
    });

    if (response.status === 200) {
      return 'Snippet deleted successfully';
    }
    throw new Error('Error deleting snippet');
  };

  const getFileTypes = async (): Promise<FileType[]> => {
    return [{ extension: 'js', language: 'javascript' }, { extension: 'ts', language: 'typescript' },
    { extension: 'py', language: 'python' }, { extension: 'java', language: 'java' }, {
      extension: 'c',
      language: 'c'
    }, { extension: 'psc', language: 'printscript' }];
  };

  return {
    createSnippet,
    updateSnippet,
    getSnippets,
    getSnippetById,
    getUserFriends,
    shareSnippet,
    getTestCases,
    postTestCase,
    removeTestCase,
    testSnippet,
    getFormatRules,
    modifyFormatRule,
    getLintingRules,
    modifyLintingRule,
    formatSnippet,
    deleteSnippet,
    getFileTypes
  };
};

export const useGetSnippets = (page: number = 0, pageSize: number = 10, snippetName?: string) => {
  const snippetOperations = useSnippetsOperations();
  return useQuery<PaginatedSnippets, Error>(['snippets', page, pageSize, snippetName], () => snippetOperations.getSnippets(page, pageSize, snippetName));
};

export const useGetSnippetById = (id: string) => {
  const snippetOperations = useSnippetsOperations();
  return useQuery<Snippet, Error>(['snippet', id], () => snippetOperations.getSnippetById(id));
};

export const useCreateSnippet = ({ onSuccess }: { onSuccess: () => void }): UseMutationResult<Snippet, Error, CreateSnippet> => {
  const snippetOperations = useSnippetsOperations();
  return useMutation(snippetOperations.createSnippet, {
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: Error) => {
      console.error('Error creating snippet:', error);
    }
  });
};

export const useUpdateSnippetById = ({ onSuccess }: { onSuccess: () => void }): UseMutationResult<Snippet, Error, {
  id: string;
  updateSnippet: UpdateSnippet;
}> => {
  const snippetOperations = useSnippetsOperations();
  return useMutation(snippetOperations.updateSnippet, {
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: Error) => {
      console.error('Error updating snippet:', error);
    }
  });
};
export const useGetUsers = (name: string = "", page: number = 0, pageSize: number = 10) => {
  const snippetOperations = useSnippetsOperations();
  return useQuery<PaginatedUsers, Error>(['users', name, page, pageSize], () => snippetOperations.getUserFriends(name, page, pageSize));
};
export const useShareSnippet = () => {
  const snippetOperations = useSnippetsOperations();
  return useMutation<Snippet, Error, { snippetId: string; name: string }>(
    ({ snippetId, name }) => snippetOperations.shareSnippet({ snippetId, name })
  );
};

export const useGetTestCases = (id: string) => {
  const snippetOperations = useSnippetsOperations();
  return useQuery(['testCases', id], () => snippetOperations.getTestCases(id));
};

export const usePostTestCase = () => {
  const snippetOperations = useSnippetsOperations();
  return useMutation<TestCase, Error, Partial<TestCase>>(
    (tc) => snippetOperations.postTestCase(tc)
  );
};

export const useRemoveTestCase = ({ onSuccess }: { onSuccess: () => void }) => {
  const snippetOperations = useSnippetsOperations();
  return useMutation<string, Error, string>(
    ['removeTestCase'],
    (id) => snippetOperations.removeTestCase(id),
    {
      onSuccess,
    }
  );
};

export type TestCaseResult = "success" | "fail";

export const useTestSnippet = () => {
  const snippetOperations = useSnippetsOperations();
  return useMutation<TestCaseResult, Error, Partial<TestCase>>(
    (tc) => snippetOperations.testSnippet(tc)
  );
};

export const useGetFormatRules = () => {
  const snippetOperations = useSnippetsOperations();
  return useQuery<Rule[], Error>('formatRules', () => snippetOperations.getFormatRules());
};

export const useModifyFormatRules = ({ onSuccess }: { onSuccess: () => void }) => {
  const snippetOperations = useSnippetsOperations();
  return useMutation<Rule[], Error, Rule[]>(
    rule => snippetOperations.modifyFormatRule(rule),
    { onSuccess }
  );
};

export const useGetLintingRules = () => {
  const snippetOperations = useSnippetsOperations();
  return useQuery<Rule[], Error>('lintingRules', () => snippetOperations.getLintingRules());
};

export const useModifyLintingRules = ({ onSuccess }: { onSuccess: () => void }) => {
  const snippetOperations = useSnippetsOperations();
  return useMutation<Rule[], Error, Rule[]>(
    rule => snippetOperations.modifyLintingRule(rule),
    { onSuccess }
  );
};

export const useFormatSnippet = () => {
  const snippetOperations = useSnippetsOperations();
  return useMutation<string, Error, string>(
    id => snippetOperations.formatSnippet(id)
  );
};

export const useDeleteSnippet = ({ onSuccess }: { onSuccess: () => void }) => {
  const snippetOperations = useSnippetsOperations();
  return useMutation<string, Error, string>(
    id => snippetOperations.deleteSnippet(id),
    {
      onSuccess,
    }
  );
};

export const useGetFileTypes = () => {
  const snippetOperations = useSnippetsOperations();
  return useQuery<FileType[], Error>('fileTypes', () => snippetOperations.getFileTypes());
};

