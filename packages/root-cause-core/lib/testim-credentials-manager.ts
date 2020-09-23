import { promises as fs } from 'fs';
import { homedir } from 'os';
import * as path from 'path';
import { parse as yamlParse } from 'yaml';

type CredentialsResponse = {
  projectId?: string;
  ciToken?: string;
};

export async function getTestimCredentials(): Promise<CredentialsResponse> {
  let projectId;
  let ciToken;
  if (process.env.TESTIM_PROJECT_ID) {
    projectId = process.env.TESTIM_PROJECT_ID;
  }
  if (process.env.TESTIM_PROJECT_TOKEN) {
    ciToken = process.env.TESTIM_PROJECT_TOKEN;
  }
  if (projectId && ciToken) {
    return { projectId, ciToken };
  }
  const yamlFile = await fs.readFile(path.join(homedir(), '.testim'));
  const yamlResults = yamlParse(yamlFile.toString());

  if (!yamlResults) {
    return {};
  }
  return { projectId: yamlResults.projectId, ciToken: yamlResults.token };
}
