pipeline {
    agent any
    environment {
        AWS_REGION = "ap-south-1"  // AWS region
        CLUSTER_NAME = "EcomEKSCluster" // EKS cluster name
        SONAR_PROJECT_KEY = "EcomProject"  // Define SonarQube project key
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
            steps {
                withSonarQubeEnv('SonarQube-Server') {
                    withCredentials([string(credentialsId: 'sonarqube_token', variable: 'sonarqube_token')]) {
                        sh '''
                            sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=http://your-sonarqube-url:9000 \
                            -Dsonar.login=$sonarqube_token
                        '''
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
                    sh '''
                    docker build -t adi2634/frontend-react:latest -t adi2634/frontend-react:${BUILD_VERSION} -f frontend/Dockerfile frontend
                    docker build -t adi2634/backend-python:latest -t adi2634/backend-python:${BUILD_VERSION} -f Backend/Dockerfile Backend
                    docker push adi2634/frontend-react:latest
                    docker push adi2634/frontend-react:${BUILD_VERSION}
                    docker push adi2634/backend-python:latest
                    docker push adi2634/backend-python:${BUILD_VERSION}
                    '''
                }
            }
        }

        stage('Authenticate with Kubernetes') {
            steps {
                script {
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: '340752823814', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                        sh '''
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

        stage('SonarQube Quality Gate') {
            steps {
                script {
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }
    }
}
