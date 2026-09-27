export const typeDefs = `#graphql
  enum ReleaseStatus {
    PLANNED
    ONGOING
    DONE
  }

  type ChecklistStep {
    id: String!
    name: String!
    description: String
    order: Int!
  }

  type Release {
    id: ID!
    name: String!
    date: String!
    status: ReleaseStatus!
    additionalInfo: String
    completedSteps: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  input CreateReleaseInput {
    name: String!
    date: String!
    additionalInfo: String
  }

  type Query {
    releases: [Release!]!
    release(id: ID!): Release
    checklistSteps: [ChecklistStep!]!
  }

  type Mutation {
    createRelease(input: CreateReleaseInput!): Release!
    updateReleaseAdditionalInfo(id: ID!, additionalInfo: String): Release!
    toggleReleaseStep(id: ID!, stepId: String!, completed: Boolean!): Release!
    deleteRelease(id: ID!): Boolean!
  }
`;
