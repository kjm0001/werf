package docker_authorizer

import (
	"fmt"
	"os"
	"path"

	"github.com/flant/werf/pkg/docker"
	"github.com/flant/werf/pkg/docker_registry"
	"github.com/flant/werf/pkg/logger"
)

type DockerCredentials struct {
	Username, Password string
}

type DockerAuthorizer struct {
	HostDockerConfigDir  string
	ExternalDockerConfig bool

	Credentials     *DockerCredentials
	PullCredentials *DockerCredentials
	PushCredentials *DockerCredentials
}

func (a *DockerAuthorizer) LoginForPull(repo string) error {
	err := a.login(a.PullCredentials, repo)
	if err != nil {
		return err
	}

	logger.LogInfoF("Login into docker repo '%s' for pull\n", repo)

	return nil
}

func (a *DockerAuthorizer) LoginForPush(repo string) error {
	err := a.login(a.PushCredentials, repo)
	if err != nil {
		return err
	}

	logger.LogInfoF("Login into docker repo '%s' for push\n", repo)

	return nil
}

func (a *DockerAuthorizer) Login(repo string) error {
	err := a.login(a.Credentials, repo)
	if err != nil {
		return err
	}

	logger.LogInfoF("Login into docker repo '%s'\n", repo)

	return nil
}

func (a *DockerAuthorizer) login(creds *DockerCredentials, repo string) error {
	if a.ExternalDockerConfig || creds == nil {
		return nil
	}

	if err := docker.Login(creds.Username, creds.Password, repo); err != nil {
		return err
	}

	if err := docker.Init(a.HostDockerConfigDir); err != nil {
		return err
	}

	return nil
}

func GetBuildStagesDockerAuthorizer(projectTmpDir, pullUsernameOption, pullPasswordOption string) (*DockerAuthorizer, error) {
	pullCredentials, err := getPullCredentials(pullUsernameOption, pullPasswordOption)
	if err != nil {
		return nil, fmt.Errorf("cannot get docker credentials for pull: %s", err)
	}

	return getDockerAuthorizer(projectTmpDir, nil, pullCredentials, nil)
}

func GetImagePublishDockerAuthorizer(projectTmpDir, pushUsernameOption, pushPasswordOption, repo string) (*DockerAuthorizer, error) {
	pushCredentials, err := getPushCredentials(pushUsernameOption, pushPasswordOption, repo)
	if err != nil {
		return nil, fmt.Errorf("cannot get docker credentials for push: %s", err)
	}

	return getDockerAuthorizer(projectTmpDir, nil, nil, pushCredentials)
}

func GetBuildAndPublishDockerAuthorizer(projectTmpDir, pullUsernameOption, pullPasswordOption, pushUsernameOption, pushPasswordOption, repo string) (*DockerAuthorizer, error) {
	pullCredentials, err := getPullCredentials(pullUsernameOption, pullPasswordOption)
	if err != nil {
		return nil, fmt.Errorf("cannot get docker credentials for pull: %s", err)
	}

	pushCredentials, err := getPushCredentials(pushUsernameOption, pushPasswordOption, repo)
	if err != nil {
		return nil, fmt.Errorf("cannot get docker credentials for push: %s", err)
	}

	return getDockerAuthorizer(projectTmpDir, nil, pullCredentials, pushCredentials)
}

func GetPurgeDockerAuthorizer(projectTmpDir, purgeUsernameOption, purgePasswordOption string) (*DockerAuthorizer, error) {
	credentials, err := getPurgeCredentials(purgeUsernameOption, purgePasswordOption)
	if err != nil {
		return nil, fmt.Errorf("cannot get docker credentials for purge: %s", err)
	}

	return getDockerAuthorizer(projectTmpDir, credentials, nil, nil)
}

func GetSyncDockerAuthorizer(projectTmpDir, syncUsernameOption, syncPasswordOption, repo string) (*DockerAuthorizer, error) {
	credentials, err := getSyncCredentials(syncUsernameOption, syncPasswordOption, repo)
	if err != nil {
		return nil, fmt.Errorf("cannot get docker credentials for sync: %s", err)
	}

	return getDockerAuthorizer(projectTmpDir, credentials, nil, nil)
}

func GetCleanupDockerAuthorizer(projectTmpDir, cleanupUsernameOption, cleanupPasswordOption, repo string) (*DockerAuthorizer, error) {
	credentials, err := getCleanupCredentials(cleanupUsernameOption, cleanupPasswordOption, repo)
	if err != nil {
		return nil, fmt.Errorf("cannot get docker credentials for cleanup: %s", err)
	}

	return getDockerAuthorizer(projectTmpDir, credentials, nil, nil)
}

func GetDeployDockerAuthorizer(projectTmpDir, usernameOption, passwordOption, repo string) (*DockerAuthorizer, error) {
	credentials, err := getDeployCredentials(usernameOption, passwordOption, repo)
	if err != nil {
		return nil, fmt.Errorf("cannot get docker credentials for deploy: %s", err)
	}

	return getDockerAuthorizer(projectTmpDir, credentials, nil, nil)
}

func getDockerAuthorizer(projectTmpDir string, credentials, pullCredentials, pushCredentials *DockerCredentials) (*DockerAuthorizer, error) {
	a := &DockerAuthorizer{Credentials: credentials, PullCredentials: pullCredentials, PushCredentials: pushCredentials}

	if werfDockerConfigEnv := os.Getenv("WERF_DOCKER_CONFIG"); werfDockerConfigEnv != "" {
		a.HostDockerConfigDir = werfDockerConfigEnv
		a.ExternalDockerConfig = true
	} else {
		if a.Credentials != nil || a.PullCredentials != nil || a.PushCredentials != nil {
			tmpDockerConfigDir := path.Join(projectTmpDir, "docker")

			if err := os.Mkdir(tmpDockerConfigDir, os.ModePerm); err != nil {
				return nil, fmt.Errorf("error creating tmp dir %s for docker config: %s", tmpDockerConfigDir, err)
			}

			logger.LogInfoF("Using tmp docker config at %s\n", tmpDockerConfigDir)

			a.HostDockerConfigDir = tmpDockerConfigDir
		} else {
			a.HostDockerConfigDir = GetHomeDockerConfigDir()
			a.ExternalDockerConfig = true
		}
	}

	if err := docker.Init(a.HostDockerConfigDir); err != nil {
		return nil, err
	}

	os.Setenv("DOCKER_CONFIG", a.HostDockerConfigDir)

	return a, nil
}

func GetHomeDockerConfigDir() string {
	return path.Join(os.Getenv("HOME"), ".docker")
}

func getPullCredentials(pullUsernameOption, pullPasswordOption string) (*DockerCredentials, error) {
	creds := getSpecifiedCredentials(pullUsernameOption, pullPasswordOption)
	if creds != nil {
		return creds, nil
	}

	return getDefaultAutologinCredentials()
}

func getPushCredentials(usernameOption, passwordOption, repo string) (*DockerCredentials, error) {
	return getDefaultCredentials(usernameOption, passwordOption, repo)
}

func getPurgeCredentials(usernameOption, passwordOption string) (*DockerCredentials, error) {
	return getSpecifiedCredentials(usernameOption, passwordOption), nil
}

func getSyncCredentials(usernameOption, passwordOption, repo string) (*DockerCredentials, error) {
	return getDefaultCredentials(usernameOption, passwordOption, repo)
}

func getDeployCredentials(usernameOption, passwordOption, repo string) (*DockerCredentials, error) {
	return getDefaultCredentials(usernameOption, passwordOption, repo)
}

func getCleanupCredentials(usernameOption, passwordOption, repo string) (*DockerCredentials, error) {
	creds := getSpecifiedCredentials(usernameOption, passwordOption)
	if creds != nil {
		return creds, nil
	}

	werfCleanupRegistryPassword := os.Getenv("WERF_CLEANUP_REGISTRY_PASSWORD")
	if werfCleanupRegistryPassword != "" {
		return &DockerCredentials{Username: "werf-cleanup", Password: werfCleanupRegistryPassword}, nil
	}

	isGCR, err := isGCR(repo)
	if err != nil {
		return nil, err
	}
	if isGCR {
		return nil, nil
	}

	return getDefaultAutologinCredentials()
}

func getDefaultCredentials(usernameOption, passwordOption, repo string) (*DockerCredentials, error) {
	creds := getSpecifiedCredentials(usernameOption, passwordOption)
	if creds != nil {
		return creds, nil
	}

	isGCR, err := isGCR(repo)
	if err != nil {
		return nil, err
	}
	if isGCR {
		return nil, nil
	}

	return getDefaultAutologinCredentials()
}

func getSpecifiedCredentials(usernameOption, passwordOption string) *DockerCredentials {
	if usernameOption != "" && passwordOption != "" {
		return &DockerCredentials{Username: usernameOption, Password: passwordOption}
	}

	return nil
}

func getDefaultAutologinCredentials() (*DockerCredentials, error) {
	if os.Getenv("WERF_IGNORE_CI_DOCKER_AUTOLOGIN") == "" {
		ciRegistryEnv := os.Getenv("CI_REGISTRY")
		ciJobTokenEnv := os.Getenv("CI_JOB_TOKEN")
		if ciRegistryEnv != "" && ciJobTokenEnv != "" {
			return &DockerCredentials{Username: "gitlab-ci-token", Password: ciJobTokenEnv}, nil
		}
	}

	return nil, nil
}

func isGCR(repoOption string) (bool, error) {
	if repoOption != "" {
		return docker_registry.IsGCR(repoOption)
	}

	return false, nil
}
