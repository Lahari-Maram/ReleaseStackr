import { gql } from '@apollo/client';

export const CREATE_RELEASE = gql`
  mutation CreateRelease($input: CreateReleaseInput!) {
    createRelease(input: $input) {
      id
      name
      date
      status
      additionalInfo
      completedSteps
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ADDITIONAL_INFO = gql`
  mutation UpdateReleaseAdditionalInfo($id: ID!, $additionalInfo: String) {
    updateReleaseAdditionalInfo(id: $id, additionalInfo: $additionalInfo) {
      id
      name
      date
      status
      additionalInfo
      completedSteps
      createdAt
      updatedAt
    }
  }
`;

export const TOGGLE_RELEASE_STEP = gql`
  mutation ToggleReleaseStep($id: ID!, $stepId: String!, $completed: Boolean!) {
    toggleReleaseStep(id: $id, stepId: $stepId, completed: $completed) {
      id
      name
      date
      status
      additionalInfo
      completedSteps
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;
