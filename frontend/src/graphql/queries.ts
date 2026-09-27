import { gql } from '@apollo/client';

export const GET_RELEASES = gql`
  query GetReleases {
    releases {
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

export const GET_RELEASE = gql`
  query GetRelease($id: ID!) {
    release(id: $id) {
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

export const GET_CHECKLIST_STEPS = gql`
  query GetChecklistSteps {
    checklistSteps {
      id
      name
      description
      order
    }
  }
`;
