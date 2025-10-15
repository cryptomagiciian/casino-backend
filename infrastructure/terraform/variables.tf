variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "casino-backend"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "dev"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "cors_origin" {
  description = "CORS origin for frontend"
  type        = string
  default     = "*"
}

variable "master_wallet_seed" {
  description = "Master wallet seed phrase"
  type        = string
  sensitive   = true
}

variable "withdrawal_secret" {
  description = "Withdrawal secret key"
  type        = string
  sensitive   = true
}
