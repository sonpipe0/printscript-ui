import {useMutation, UseMutationResult, useQuery} from 'react-query';
import {ComplianceEnum, CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet} from './snippet.ts';
import {PaginatedUsers} from "./users.ts";
import {TestCase} from "../types/TestCase.ts";
import {FileType} from "../types/FileType.ts";
import {Rule} from "../types/Rule.ts";
import {useAuth0} from "@auth0/auth0-react";
import {paginationParams} from './pagination.ts';
import {useEffect, useState} from "react";


export const useSnippetsOperations = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [token, setToken] = useState<string | null>(null);
  const backendUrl = process.env.BACKEND_URL;

  useEffect(() => {
    getAccessTokenSilently()
      .then(token => {
        setToken(token);
      })
      .catch(error => {
        console.error('Error getting access token', error);
      });
  }, []); // Empty dependency array ensures this runs only once

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    if (!token) throw new Error('Token is not initialized');
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
    return response.json();
  };

  const createSnippet = async (newSnippet: CreateSnippet): Promise<Snippet> => {
    const body = {
      title: newSnippet.name,
      language: newSnippet.language,
      extension: newSnippet.extension,
      code: newSnippet.content
    }
    return fetchWithAuth('/snippet/save', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  };

  const updateSnippet = async ({ id, updateSnippet }: { id: string; updateSnippet: UpdateSnippet }): Promise<Snippet> => {
    const body = { id, ...updateSnippet };
    return fetchWithAuth('/snippet/update', {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  };

  const getSnippets = async (page: number = 0, pageSize: number = 10, snippetName?: string): Promise<PaginatedSnippets> => {
    const response = await fetchWithAuth(`/snippet/get/all?relation=ALL&${paginationParams(page, pageSize)}&prefix=${snippetName}`);

    const snippets: Snippet[] = response.map((snippet: { author: string; id: string; title: string; language: string; extension: string; code: string; lintStatus: string; }) => {
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
          compliance = 'pending';
      }
      return {
        id: snippet.id,
        name: snippet.title,
        content: snippet.code,
        language: snippet.language,
        extension: snippet.extension,
        compliance: compliance,
        author: snippet.author
      };
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
    return fetchWithAuth(`/snippet/details?snippetId=${id}`);
  };

  const getUserFriends = async (name: string = "", page: number = 0, pageSize: number = 10): Promise<PaginatedUsers> => {
    return fetchWithAuth(`/snippet/get/users?prefix=${name}&${paginationParams(page, pageSize)}`);
  };

  const shareSnippet = async ({ snippetId, userId }: { snippetId: string; userId: string }): Promise<Snippet> => {
    return fetchWithAuth('/snippet/share', {
      method: 'POST',
      body: JSON.stringify({ snippetId, userId })
    });
  };

  const getTestCases = async (): Promise<TestCase[]> => {
    return fetchWithAuth('/testCases');
  };

  const postTestCase = async (tc: Partial<TestCase>): Promise<TestCase> => {
    return fetchWithAuth('/testCases', {
      method: 'POST',
      body: JSON.stringify(tc)
    });
  };

  const removeTestCase = async (id: string): Promise<string> => {
    return fetchWithAuth(`/testCases/${id}`, {
      method: 'DELETE'
    });
  };

  const testSnippet = async (tc: Partial<TestCase>): Promise<TestCaseResult> => {
    return fetchWithAuth('/snippet/test', {
      method: 'POST',
      body: JSON.stringify(tc)
    });
  };

  const getFormatRules = async (): Promise<Rule[]> => {
    return fetchWithAuth('/formatRules');
  };

  const modifyFormatRule = async (rule: Rule[]): Promise<Rule[]> => {
    return fetchWithAuth('/formatRules', {
      method: 'PUT',
      body: JSON.stringify(rule)
    });
  };

  const getLintingRules = async (): Promise<Rule[]> => {
    return fetchWithAuth('/lintingRules');
  };

  const modifyLintingRule = async (rule: Rule[]): Promise<Rule[]> => {
    return fetchWithAuth('/lintingRules', {
      method: 'PUT',
      body: JSON.stringify(rule)
    });
  };

  const formatSnippet = async (snippetContent: string): Promise<string> => {
    return fetchWithAuth('/snippet/format', {
      method: 'POST',
      body: JSON.stringify({ snippetContent })
    });
  };

  const deleteSnippet = async (id: string): Promise<string> => {
    return fetchWithAuth(`/snippet/${id}`, {
      method: 'DELETE'
    });
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

export const useGetUserFriends = (name: string = "", page: number = 0, pageSize: number = 10) => {
  const snippetOperations = useSnippetsOperations();
  return useQuery<PaginatedUsers, Error>(['users', name, page, pageSize], () => snippetOperations.getUserFriends(name, page, pageSize));
};

export const useGetUsers = (name: string = "", page: number = 0, pageSize: number = 10) => {
  const snippetOperations = useSnippetsOperations();
  return useQuery<PaginatedUsers, Error>(['users', name, page, pageSize], () => snippetOperations.getUserFriends(name, page, pageSize));
};
export const useShareSnippet = () => {
  const snippetOperations = useSnippetsOperations();
  return useMutation<Snippet, Error, { snippetId: string; userId: string }>(
    ({ snippetId, userId }) => snippetOperations.shareSnippet({ snippetId, userId })
  );
};

export const useGetTestCases = () => {
  const snippetOperations = useSnippetsOperations();
  return useQuery<TestCase[] | undefined, Error>(['testCases'], () => snippetOperations.getTestCases(), {});
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
    snippetContent => snippetOperations.formatSnippet(snippetContent)
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

