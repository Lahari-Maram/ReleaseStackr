/// <reference types="vite/client" />
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const uri = import.meta.env.VITE_GRAPHQL_URL || '/graphql';

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
});
