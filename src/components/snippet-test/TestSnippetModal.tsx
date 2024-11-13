import { Box, Divider, IconButton, Tab, Tabs, Typography } from "@mui/material";
import { ModalWrapper } from "../common/ModalWrapper.tsx";
import { SyntheticEvent, useState } from "react";
import { AddRounded } from "@mui/icons-material";
import { useGetTestCases, usePostTestCase, useRemoveTestCase } from "../../utils/queries.tsx";
import { TabPanel } from "./TabPanel.tsx";
import { queryClient } from "../../App.tsx";
import { TestCase } from "../../types/TestCase.ts";

type TestSnippetModalProps = {
  open: boolean
  onClose: () => void
  id: string
}

export const TestSnippetModal = ({ open, onClose, id }: TestSnippetModalProps) => {
  const [value, setValue] = useState(0);
  const { data: testCases } = useGetTestCases(id);
  const { mutateAsync: postTestCase } = usePostTestCase();
  const { mutateAsync: removeTestCase } = useRemoveTestCase({
    onSuccess: () => queryClient.invalidateQueries('testCases')
  });

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handlePostTestCase = async (testCase: Partial<TestCase>) => {
    const payload = {
      id,
      name: testCase.name ?? "",
      input: testCase.input ?? [],
      output: testCase.output ?? [],
    };
    await postTestCase(payload);
  };

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <Typography variant={"h5"}>Test snippet</Typography>
      <Divider />
      <Box mt={2} display="flex">
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={value}
          onChange={handleChange}
          aria-label="Vertical tabs example"
          sx={{ borderRight: 1, borderColor: 'divider' }}
        >
          {testCases?.map((testCase) => (
            <Tab label={testCase.name} />
          ))}
          <IconButton disableRipple onClick={() => setValue((testCases?.length ?? 0) + 1)}>
            <AddRounded />
          </IconButton>
        </Tabs>
        {testCases?.map((testCase, index) => (
          <TabPanel id={id} index={index} value={value} test={testCase}
            setTestCase={(tc) => handlePostTestCase(tc as TestCase)}
            removeTestCase={(i) => removeTestCase(i)}
          />
        ))}
        <TabPanel id={id} index={(testCases?.length ?? 0) + 1} value={value}
          setTestCase={(tc) => handlePostTestCase(tc)}
        />
      </Box>
    </ModalWrapper>
  )
}
