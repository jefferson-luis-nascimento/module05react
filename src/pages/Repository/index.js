import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FaSpinner, FaBackward, FaForward } from 'react-icons/fa';

import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, IssueFilter, Paging } from './styles';

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
      { state: 'all', label: 'Todas', active: false },
      { state: 'open', label: 'Abertas', active: true },
      { state: 'closed', label: 'Fechadas', active: false },
    ],
    filterIndex: 0,
    page: 1,
    maxPerPage: 30,
    totalIssues: 0,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { filters, maxPerPage } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filters.find(f => f.active).state,
          per_page: maxPerPage,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      totalIssues: issues.data.length,
      loading: false,
    });
  }

  handleFilterClick = async filterIndex => {
    const { filters } = this.state;

    const newFilters = filters.map(filter => {
      return {
        state: filter.state,
        label: filter.label,
        active: false,
      };
    });

    newFilters[filterIndex].active = true;

    await this.setState({ filters: newFilters, filterIndex });
    this.loadIssues();
  };

  loadIssues = async () => {
    const { match } = this.props;
    const { filters, filterIndex, maxPerPage, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filters[filterIndex].state,
        per_page: maxPerPage,
        page,
      },
    });

    this.setState({
      issues: response.data,
      totalIssues: response.data.length,
    });
  };

  handlePaging = async increment => {
    const { page, filterIndex } = this.state;

    if (increment) {
      this.setState({ page: page + 1 });
    } else if (page > 1) {
      this.setState({ page: page - 1 });
    }

    await this.setState({ filterIndex });
    this.loadIssues();
  };

  render() {
    const {
      repository,
      issues,
      loading,
      filters,
      page,
      totalIssues,
      maxPerPage,
    } = this.state;

    return (
      <>
        {loading && (
          <Loading loading={String(loading)}>
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
                  active={index}
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

            <Paging>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => this.handlePaging(false)}
              >
                <FaBackward />
              </button>
              <span>{page}</span>
              <button
                type="button"
                disabled={totalIssues !== maxPerPage}
                onClick={() => this.handlePaging(true)}
              >
                <FaForward />
              </button>
            </Paging>
          </IssueList>
        </Container>
      </>
    );
  }
}
