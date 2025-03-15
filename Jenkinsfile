pipeline {
    agent any
    environment {
        AWS_REGION = "ap-south-1" 
        CLUSTER_NAME = "EcomEKSCluster"
    }
    stages {
        stage('Clean Previous Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/AdyaPatil/E-Commerce-Website.git'
            }
        }

        stage('Secure ConfigMap Update') {
            steps {
                script {
                    withCredentials([
                        string(credentialsId: 'DB_URL', variable: 'DB_URL'),
                        string(credentialsId: 'SECRET_KEY', variable: 'SECRET_KEY'),
                        string(credentialsId: 'JWT_EXPIRATION', variable: 'JWT_EXPIRATION')
                    ]) {
                        sh '''
                        # Update ecommerce-config.yaml with sensitive data
                        sed -i "s|PLACEHOLDER_DB_URL|$DB_URL|g" Backend/ecommerce-config.yaml
                        sed -i "s|PLACEHOLDER_SECRET_KEY|$SECRET_KEY|g" Backend/ecommerce-config.yaml
                        sed -i "s|PLACEHOLDER_JWT_EXPIRATION|$JWT_EXPIRATION|g" Backend/ecommerce-config.yaml

                        # Apply the updated config to Kubernetes
                        kubectl apply -f Backend/ecommerce-config.yaml
                        '''
                    }
                }
            }
        }

        stage('Login to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_HUB_USER', passwordVariable: 'DOCKER_HUB_PASS')]) {
                        sh "echo \$DOCKER_HUB_PASS | docker login -u \$DOCKER_HUB_USER --password-stdin"
                    }
                }
            }
        }

        stage('Build and Push Images') {
            steps {
                script {
                    sh """
                    docker build -t adi2634/frontend-react:latest -f frontend/Dockerfile frontend
                    docker build -t adi2634/backend-python:latest -f Backend/Dockerfile Backend
                    docker push adi2634/frontend-react:latest
                    docker push adi2634/backend-python:latest
                    """
                }
            }
        }

        stage('Authenticate with Kubernetes') {
            steps {
                script {
                    withCredentials([[
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: '340752823814',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ]]) {
                        sh """
                        aws configure set aws_access_key_id ${AWS_ACCESS_KEY_ID}
                        aws configure set aws_secret_access_key ${AWS_SECRET_ACCESS_KEY}
                        aws configure set region ${AWS_REGION}

                        aws eks update-kubeconfig --name ${CLUSTER_NAME} --region ${AWS_REGION}
                        kubectl config current-context
                        """
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh """
                    kubectl apply -f frontend-deployment.yaml
                    kubectl apply -f backend-deployment.yaml
                    kubectl apply -f frontend-service.yaml
                    kubectl apply -f backend-service.yaml
                    """
                }
            }
        }
    }
}
