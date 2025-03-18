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

        stage('SonarQube Analysis') {
    environment {
        SONARQUBE_SCANNER_HOME = tool 'SonarScanner'
    }
    steps {
        withCredentials([string(credentialsId: 'sonarToken', variable: 'SONAR_TOKEN')]) {
            script {
                echo "🔹 Checking SonarQube Server Connectivity..."
                // Check if SonarQube is reachable
                sh "curl -I http://13.200.247.68:9000 || echo 'SonarQube Server Not Reachable!'"

                echo "🔹 Verifying SonarScanner Path..."
                // Confirm SonarScanner path
                sh "ls -la ${SONARQUBE_SCANNER_HOME}/bin"

                echo "🔹 Checking SonarQube Authentication..."
                // Test authentication
                sh "curl -u ${SONAR_TOKEN}: http://13.200.247.68:9000/api/system/status || echo 'Authentication Failed!'"

                dir('frontend') {
                    echo "🔹 Running SonarQube Analysis for Frontend..."
                    sh """
                    ${SONARQUBE_SCANNER_HOME}/bin/sonar-scanner \
                    -Dsonar.projectKey=ECommerce-React-Frontend \
                    -Dsonar.sources=src \
                    -Dsonar.language=js \
                    -Dsonar.host.url=http://13.200.247.68:9000 \
                    -Dsonar.login=${SONAR_TOKEN} \
                    -Dsonar.exclusions="**/node_modules/**, **/build/**" \
                    -X  # Enable debug logging for sonar-scanner
                    """
                }

                dir('Backend') {
                    echo "🔹 Running SonarQube Analysis for Backend..."
                    sh """
                    ${SONARQUBE_SCANNER_HOME}/bin/sonar-scanner \
                    -Dsonar.projectKey=ECommerce-FastAPI-Backend \
                    -Dsonar.sources=. \
                    -Dsonar.language=py \
                    -Dsonar.host.url=http://13.200.247.68:9000 \
                    -Dsonar.login=${SONAR_TOKEN} \
                    -Dsonar.exclusions="**/migrations/**, **/__pycache__/**, **/venv/**" \
                    -X  # Enable debug logging for sonar-scanner
                    """
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

        stage('Build and Push Images') {
            steps {
                script {
                    def BUILD_VERSION = "v${env.BUILD_NUMBER}"
                    sh """
                    docker build -t adi2634/frontend-react:latest -t adi2634/frontend-react:${BUILD_VERSION} -f frontend/Dockerfile frontend
                    docker build -t adi2634/backend-python:latest -t adi2634/backend-python:${BUILD_VERSION} -f Backend/Dockerfile Backend
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
