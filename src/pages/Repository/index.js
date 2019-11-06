import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FaSpinner } from 'react-icons/fa';

import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, IssueFilter } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    filters: [
      { state: 'all', label: 'Todas', active: true },
      { state: 'open', label: 'Abertas', active: false },
      { state: 'closed', label: 'Fechadas', active: false },
    ],
    filterIndex: 0,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { filters } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filters.find(f => f.active).state,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  handleFilterClick = async filterIndex => {
    await this.setState({ filterIndex });
    this.loadIssues();
  };

  loadIssues = async () => {
    const { match } = this.props;
    const { filters, filterIndex } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filters[filterIndex].state,
        per_page: 5,
      },
    });

    this.setState({ issues: response.data });
  };

  handleSubmit = async e => {
    e.preventDefault();
    await this.getIssues();
  };

  render() {
    const { repository, issues, loading, filters } = this.state;

    return (
      <>
        {loading && (
          <Loading loading={loading}>
            <FaSpinner color="#fff" size={30} />
            <span> Carregando...</span>
          </Loading>
        )}
        <Container>
          <Owner>
            <Link to="/">Voltar aos Repositórios</Link>
            <img
              src={repository.owner && repository.owner.avatar_url}
              alt={repository.owner && repository.owner.login}
            />
            <h1>{repository.name}</h1>
            <p>{repository.description}</p>
          </Owner>

          <IssueList>
            <IssueFilter onSubmit={this.handleSubmit}>
              {filters.map((filter, index) => (
                <button
                  type="button"
                  key={filter.label}
                  onClick={() => this.handleFilterClick(index)}
                >
                  {filter.label}
                </button>
              ))}
            </IssueFilter>

            {issues.map(issue => (
              <li key={String(issue.id)}>
                <img
                  src={issue.user && issue.user.avatar_url}
                  alt={issue.user && issue.user.login}
                />
                <div>
                  <strong>
                    <a href={issue.html_url}>{issue.title}</a>
                    {issue.labels.map(label => (
                      <span key={String(label.id)}>{label.name}</span>
                    ))}
                  </strong>
                  <p>{issue.user.login}</p>
                </div>
              </li>
            ))}
          </IssueList>
        </Container>
      </>
    );
  }
}
