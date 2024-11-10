import { useMutation, UseMutationResult, useQuery } from 'react-query';
import { CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet } from './snippet.ts';
import { PaginatedUsers } from "./users.ts";
import { TestCase } from "../types/TestCase.ts";
import { FileType } from "../types/FileType.ts";
import { Rule } from "../types/Rule.ts";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import axios, { AxiosInstance } from "axios";
import { paginationParams } from './pagination.ts';

export const useSnippetsOperations = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [axiosInstance, setAxiosInstance] = useState<AxiosInstance>();

  useEffect(() => {
    getAccessTokenSilently()
      .then(token => {
        console.log(token);
        const instance = axios.create({
          baseURL: process.env.BACKEND_URL,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setAxiosInstance(instance);
      })
      .catch(error => {
        console.error('Error getting access token', error);
      });
  }, [getAccessTokenSilently]);

  const createSnippet = async (newSnippet: CreateSnippet): Promise<Snippet> => {
    const response = await axiosInstance?.post('/snippet/save', newSnippet);
    return response?.data;
  };

  const updateSnippet = async ({ id, updateSnippet }: { id: string; updateSnippet: UpdateSnippet }): Promise<Snippet> => {
    const body = {
      id: id,
      ...updateSnippet
    };
    const response = await axiosInstance?.put(`/snippet/update`, body);
    return response?.data;
  };

  const getSnippets = async (page: number = 0, pageSize: number = 10, snippetName?: string): Promise<PaginatedSnippets> => {
    const response = await axiosInstance?.get(`snippet/get/all?relation=ALL&${paginationParams(page, pageSize)}&prefix=${snippetName}`);
    return response?.data;
  };

  const getSnippetById = async (id: string): Promise<Snippet> => {
    const response = await axiosInstance?.get(`/snippet/details?snippetId=${id}`);
    return response?.data;
  };

  const getUserFriends = async (name: string = "", page: number = 0, pageSize: number = 10): Promise<PaginatedUsers> => {
    const response = await axiosInstance?.get(`/snippet/get/users?prefix=${name}&page=${page}&pageSize=${pageSize}`);
    return response?.data;
  };

  const shareSnippet = async ({ snippetId, userId }: { snippetId: string; userId: string }): Promise<Snippet> => {
    const response = await axiosInstance?.post(`/snippet/share`, { snippetId, userId });
    return response?.data;
  };

  const getTestCases = async (): Promise<TestCase[]> => {
    const response = await axiosInstance?.get(`/testCases`);
    return response?.data;
  };

  const postTestCase = async (tc: Partial<TestCase>): Promise<TestCase> => {
    const response = await axiosInstance?.post(`/testCases`, tc);
    return response?.data;
  };

  const removeTestCase = async (id: string): Promise<string> => {
    const response = await axiosInstance?.delete(`/testCases/${id}`);
    return response?.data;
  };

  const testSnippet = async (tc: Partial<TestCase>): Promise<TestCaseResult> => {
    const response = await axiosInstance?.post(`/snippet/test`, tc);
    return response?.data;
  };

  const getFormatRules = async (): Promise<Rule[]> => {
    const response = await axiosInstance?.get(`/formatRules`);
    return response?.data;
  };

  const modifyFormatRule = async (rule: Rule[]): Promise<Rule[]> => {
    const response = await axiosInstance?.put(`/formatRules`, rule);
    return response?.data;
  };

  const getLintingRules = async (): Promise<Rule[]> => {
    const response = await axiosInstance?.get(`/lintingRules`);
    return response?.data;
  };

  const modifyLintingRule = async (rule: Rule[]): Promise<Rule[]> => {
    const response = await axiosInstance?.put(`/lintingRules`, rule);
    return response?.data;
  };

  const formatSnippet = async (snippetContent: string): Promise<string> => {
    const response = await axiosInstance?.post(`/snippet/format`, { snippetContent });
    return response?.data;
  };

  const deleteSnippet = async (id: string): Promise<string> => {
    const response = await axiosInstance?.delete(`/snippet/${id}`);
    return response?.data;
  };

  const getFileTypes = async (): Promise<FileType[]> => {
    const response = await axiosInstance?.get(`/fileTypes`);
    return response?.data;
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

