pipeline {
    agent any
    environment {
        AWS_REGION = "ap-south-1"  // AWS region
        CLUSTER_NAME = "EcomEKSCluster" // EKS cluster name
    }
    stages {
        stage('Clean Previous Workspace') {
            steps {
                cleanWs() // Clean workspace before running
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/AdyaPatil/E-Commerce-Website.git'
            }
        }

        stage('Retrieve config.json from Jenkins Secrets') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'CONFIG_JSON', variable: 'CONFIG_JSON_CONTENT')]) {
                        sh '''
                        echo "$CONFIG_JSON_CONTENT" > config.json
                        kubectl create secret generic config-secret --from-file=config.json --dry-run=client -o yaml | kubectl apply -f -
                        rm -f config.json
                        '''
                    }
                }
            }
        }

        stage('Create Kubernetes Secret for MongoDB') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'DB_URL', variable: 'MONGO_DB_URL')]) {
                        sh '''
                        kubectl delete secret mongo-secret --ignore-not-found
                        kubectl create secret generic mongo-secret --from-literal=MONGO_DB_URL="$MONGO_DB_URL"
                        '''
                    }
                }
            }
        }


        stage('Debug Sonar Environment') {
    steps {
        sh '''
        echo "SonarQube Scanner Path: ${SONARQUBE_SCANNER_HOME}"
        echo "SonarQube URL: ${SONAR_URL}"
        echo "SonarQube Token: ${SONAR_TOKEN}"
        ls -la ${SONARQUBE_SCANNER_HOME}/bin
        '''
    }
}


        stage('SonarQube Analysis') {
    environment {
        SONARQUBE_SCANNER_HOME = tool 'SonarScanner'
    }
    steps {
        withCredentials([string(credentialsId: 'sonarToken', variable: 'SONAR_TOKEN'),string(credentialsId: 'sonarIP', variable: 'SONAR_URL')]) {
            script {
                dir('frontend') {
                    sh '''
                    ${SONARQUBE_SCANNER_HOME}/bin/sonar-scanner \
                    -Dsonar.projectKey=ECommerce-React-Frontend \
                    -Dsonar.sources=src \
                    -Dsonar.language=js \
                    -Dsonar.host.url=${SONAR_URL} \
                    -Dsonar.login=${SONAR_TOKEN} \
                    -Dsonar.exclusions="**/node_modules/**, **/build/**" \
                    -X
                    '''
                }

                dir('Backend') {
                    sh '''
                    ${SONARQUBE_SCANNER_HOME}/bin/sonar-scanner \
                    -Dsonar.projectKey=ECommerce-FastAPI-Backend \
                    -Dsonar.sources=. \
                    -Dsonar.language=py \
                    -Dsonar.host.url=${SONAR_URL} \
                    -Dsonar.login=${SONAR_TOKEN} \
                    -Dsonar.exclusions="**/migrations/**, **/__pycache__/**, **/venv/**" \
                    -X
                    '''
                }
            }
        }
    }
}



        stage('Login to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_HUB_USER', passwordVariable: 'DOCKER_HUB_PASS')]) {
                        sh "echo $DOCKER_HUB_PASS | docker login -u $DOCKER_HUB_USER --password-stdin"
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    def BUILD_VERSION = "v${env.BUILD_NUMBER}"
                    sh """
                    docker build -t adi2634/frontend-react:latest -t adi2634/frontend-react:${BUILD_VERSION} -f frontend/Dockerfile frontend
                    docker build -t adi2634/backend-python:latest -t adi2634/backend-python:${BUILD_VERSION} -f Backend/Dockerfile Backend
                    """
                }
            }
        }

        stage('Trivy Scan for Vulnerabilities') {
            steps {
                script {
                    echo "Running Trivy Scan for Frontend Image..."
                    sh """
                    trivy image adi2634/frontend-react:latest --severity HIGH,CRITICAL || true
                    """

                    echo "Running Trivy Scan for Backend Image..."
                    sh """
                    trivy image adi2634/backend-python:latest --severity HIGH,CRITICAL || true
                    """
                }
            }
        }

        stage('Push Docker Images to Docker Hub') {
            steps {
                script {
                    def BUILD_VERSION = "v${env.BUILD_NUMBER}"
                    sh """
                    docker push adi2634/frontend-react:latest
                    docker push adi2634/frontend-react:${BUILD_VERSION}
                    docker push adi2634/backend-python:latest
                    docker push adi2634/backend-python:${BUILD_VERSION}
                    """
                }
            }
        }

        stage('Authenticate with Kubernetes') {
            steps {
                script {
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: '340752823814', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                        sh '''
                        export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                        export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                        export AWS_DEFAULT_REGION=${AWS_REGION}
                        aws eks update-kubeconfig --name ${CLUSTER_NAME} --region ${AWS_REGION}
                        kubectl config current-context
                        '''
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh '''
                    kubectl apply -f frontend-config.yaml
                    kubectl apply -f frontend-deployment.yaml
                    kubectl rollout restart deployment frontend-deployment
                    kubectl apply -f backend-deployment.yaml
                    kubectl apply -f frontend-service.yaml
                    kubectl apply -f backend-service.yaml
                    '''
                }
            }
        }
    }
}
