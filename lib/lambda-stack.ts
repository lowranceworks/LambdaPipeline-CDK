/*
Let's define the AWS CloudFormation stack that will create the Lambda function, the stack that we'll deploy in our pipeline.

We need some way to get a reference to the Lambda function we'll be deploying. 
This code is built by the pipeline, and the pipeline passes us a reference to it as AWS CloudFormation parameters.
We get it using the fromCfnParameters() method and store it as an attribute named lambdaCode, where it can be picked up by the deployment stage of the pipeline.

The example also uses the CodeDeploy support for blue-green deployments to Lambda, transferring traffic to the new version in 10-percent increments every minute.
As blue-green deployment can only operate on aliases, not on the function directly, we create an alias for our function, named Prod.

The alias uses a Lambda version obtained using the function's currentVersion property.
This ensures that every invocation of the AWS CDK code publishes a new version of the function.

If the Lambda function needs any other resources when executing, such as an Amazon S3 bucket, Amazon DynamoDB table, or Amazon API Gateway, you'd declare those resources here.
*/
import * as codedeploy from '@aws-cdk/aws-codedeploy';
import * as lambda from '@aws-cdk/aws-lambda';
import { App, Stack, StackProps } from '@aws-cdk/core';
      
export class LambdaStack extends Stack {
  public readonly lambdaCode: lambda.CfnParametersCode;
      
  constructor(app: App, id: string, props?: StackProps) {
    super(app, id, props);
      
    this.lambdaCode = lambda.Code.fromCfnParameters();
      
    const func = new lambda.Function(this, 'Lambda', {
      code: this.lambdaCode,
      handler: 'index.main',
      runtime: lambda.Runtime.NODEJS_10_X,
      description: `Function generated on: ${new Date().toISOString()}`,
    });
      
    const alias = new lambda.Alias(this, 'LambdaAlias', {
      aliasName: 'Prod',
      version: func.currentVersion,
    });
      
    new codedeploy.LambdaDeploymentGroup(this, 'DeploymentGroup', {
      alias,
      deploymentConfig: codedeploy.LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTE,
    });
  }
}