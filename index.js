import 'cross-fetch/polyfill';
import ApolloClient, { gql } from 'apollo-boost';
//import _ from './env';
import dotenv from 'dotenv';

dotenv.load();
const client = new ApolloClient({
  uri: 'https://api.github.com/graphql',
  request: operation => {
    operation.setContext({
      headers: {
        authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
      },
    });
  },
});

console.log('process.env.GITHUB_PERSONAL_ACCESS_TOKEN', process.env.GITHUB_PERSONAL_ACCESS_TOKEN);

const GET_REPOSITORIES_OF_ORGANIZATION = gql`
query ($organization: String!, $cursor: String) {
  organization(login: $organization) {
    name
    url
		repositories(
      first: 5, 
      orderBy: { field: STARGAZERS, direction: DESC}
      after: $cursor
    ) {
		  pageInfo {
        endCursor
        hasNextPage
      }
      edges {
		    node {
					...repository
		    }
		  }
			totalCount
		}
  }
}

fragment repository on Repository {
	id
  name
  url
}
`;

const ADD_STAR = gql`
  mutation AddStar($repositoryId: ID!) {
    addStar(input: { starrableId: $repositoryId }) {
      starrable {
        id
        viewerHasStarred
      }
    }
  }
`;

const REMOVE_STAR = gql`
  mutation RemoveStar($repositoryId: ID!) {
    removeStar(input: { starrableId: $repositoryId }) {
      starrable {
        id
        viewerHasStarred
      }
    }
  }
`;

client
  .query({
    query: GET_REPOSITORIES_OF_ORGANIZATION,
    variables: {
      organization: 'the-road-to-learn-react',
      cursor: undefined,
    },
  })
  // resolve first page
  .then(result => {
    const { pageInfo, edges } = result.data.organization.repositories;
    const { endCursor, hasNextPage } = pageInfo;

    console.log('first page', edges.length);
    console.log('endCursor', endCursor);

    return pageInfo;
  })
  // query second page
  .then(({ endCursor, hasNextPage }) => {
    if (!hasNextPage) {
      throw Error('no next page');
    }

    return client.query({
      query: GET_REPOSITORIES_OF_ORGANIZATION,
      variables: {
        organization: 'the-road-to-learn-react',
        cursor: endCursor,
      },
    });
  })
  // resolve second page
  .then(result => {
    const { pageInfo, edges } = result.data.organization.repositories;
    const { endCursor, hasNextPage } = pageInfo;

    console.log('second page', edges.length);
    console.log('endCursor', endCursor);

    return pageInfo;
  })
  // log error when there is no next page
  .catch(console.log);

  client
    .mutate({
      mutation: ADD_STAR,
      variables: {
        repositoryId: 'MDEwOlJlcG9zaXRvcnkxMDc5MjUxNTY=',
      },
    })
    .then(result => {
      const { starrable } = result.data.addStar;
      console.log('starrable', starrable);
    });

  /*client
    .mutate({
      mutation: REMOVE_STAR,
      variables: {
        repositoryId: 'MDEwOlJlcG9zaXRvcnkxMDc5MjUxNTY='
      },
    })
    .then(console.log);
  */