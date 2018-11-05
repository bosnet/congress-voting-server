docker:
	docker build -t gcr.io/devenv-205606/membership-server:commit-`git log -1 --format="%h"` . | tee -a ${LOG_MOUNT_PATH}/docker-build.txt
