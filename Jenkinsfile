podTemplate(yaml: '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: buildah
    image: quay.io/buildah/stable:v1.29.0
    command:
    - sleep
    args:
    - 99d
    env:
      - name: REG_USERNAME
        valueFrom:
          secretKeyRef:
            name: jenkins-registry-login
            key: username
      - name: REG_PASSWORD
        valueFrom:
          secretKeyRef:
            name: jenkins-registry-login
            key: password
      - name: REG_HOSTNAME
        valueFrom:
          secretKeyRef:
            name: jenkins-registry-login
            key: hostname
      - name: REG_FOLDER
        valueFrom:
          secretKeyRef:
            name: jenkins-registry-login
            key: folder
''') {
    node(POD_LABEL) {
        stage("checkout") {
            checkout scm
            script {
                VERSION_NUMBER = VersionNumber(versionNumberString: '${BUILD_YEAR}${BUILDS_THIS_YEAR, XXX}')
                currentBuild.displayName = "${VERSION_NUMBER}"
                env.BUILD_NUMBER=VERSION_NUMBER
            }
        }
        stage("dockerlogin") {
            container('buildah') {
                sh 'echo "${REG_PASSWORD}" | buildah login -u ${REG_USERNAME} --password-stdin ${REG_HOSTNAME}'
            }
        }
        stage("dockerfile") {
            container('buildah') {
                sh 'buildah version && \
                buildah build \
                --build-arg REG_HOSTNAME=${REG_HOSTNAME} \
                --build-arg REG_FOLDER=${REG_FOLDER} \
                -t ${REG_HOSTNAME}/${REG_FOLDER}/forth-conference:b${BUILD_NUMBER} \
                -t ${REG_HOSTNAME}/${REG_FOLDER}/forth-conference:latest .'
            }
        }
        stage("dockerpush") {
            container('buildah') {
                sh 'buildah push ${REG_HOSTNAME}/${REG_FOLDER}/forth-conference:b${BUILD_NUMBER}'
                sh 'buildah push ${REG_HOSTNAME}/${REG_FOLDER}/forth-conference:latest'
            }
        }
    }
}
