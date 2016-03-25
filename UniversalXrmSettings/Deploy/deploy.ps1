clear;

function Add-Crm-Sdk
{
	# Load SDK assemblies
	Add-Type -Path "$PSScriptRoot\Assemblies\Microsoft.Xrm.Sdk.dll";
	Add-Type -Path "$PSScriptRoot\Assemblies\Microsoft.Xrm.Client.dll";
	Add-Type -Path "$PSScriptRoot\Assemblies\Microsoft.Crm.Sdk.Proxy.dll";
}

function Get-Configuration()
{
	$configFilePath = "$PSScriptRoot\config.xml";
    $content = Get-Content $configFilePath;
	return [xml]$content;
}

function Get-WebResource
{
     PARAM
    (
        [parameter(Mandatory=$true)]$name
    )

    $query = New-Object -TypeName Microsoft.Xrm.Sdk.Query.QueryExpression -ArgumentList "webresource";
    $query.Criteria.AddCondition("name", [Microsoft.Xrm.Sdk.Query.ConditionOperator]::Equal, $name);
    $query.ColumnSet.AddColumn("content");
    $results = $service.RetrieveMultiple($query);
    $records = $results.Entities;

    if($records.Count -eq 1)
    {
        return $records[0];
    }
    return $null;
}

function Get-Base64
{
   PARAM
   (
       [parameter(Mandatory=$true)]$path
   )
   $content = [System.IO.File]::ReadAllBytes($path);
   $content64 = [System.Convert]::ToBase64String($content);
   return $content64;
}

Add-Crm-Sdk;
$config = Get-Configuration;
$publishXmlRequest = "<importexportxml><webresources>";

# =======================================================
# Crm Connection
# =======================================================
$crmConnectionString = $config.Configuration.CrmConnectionString;
$crmConnection = [Microsoft.Xrm.Client.CrmConnection]::Parse($crmConnectionString);
$service = New-Object -TypeName Microsoft.Xrm.Client.Services.OrganizationService -ArgumentList $crmConnection;

#=====
# File Config
#=====

$basePath = $PSScriptRoot + $config.Configuration.WebResourceFiles.basePath;
$webresourceFiles = $config.Configuration.WebResourceFiles.WebResourceFile;
$publisherPrefix = $config.Configuration.SolutionPrefix;

$d = Get-Date;
Write-Host "$d - Deploy WebResources start" -ForegroundColor Cyan;

$total = $webresourceFiles.Count;
$current = 0;

foreach($wrfile in $webresourceFiles)
{    
    $current++;
    $percent = ($current/$total)*100;
        
    # =======================================================
    # Handle prefix in file name
    # =======================================================
	$webResourcePath = $basePath +  $wrfile.file;
	$webResourceName = $publisherPrefix + $wrfile.path;
    
    Write-Host " - WebResource '$webResourceName' (Path : $webResourcePath) " -NoNewline;
    Write-Progress -Activity "WebResource deployment" -Status "[$current/$total] WebResource '$webResourceName' (Path : $webResourcePath)" -PercentComplete $percent;
             
    # =======================================================
    # Check webresource existence
    # If not exists, create it
    # Else update it
    # =======================================================
    $webResourceContentB64 = Get-Base64 $webResourcePath;    
    $webresource = Get-WebResource $webResourceName;
    if($webresource -eq $null)
    {
        #region Webresource creation
        Write-Host " not found!" -ForegroundColor Yellow -NoNewline;
        
        Write-Host "=> Create it ..." -NoNewline;
                           
        # =======================================================
        # Create webresource
        # =======================================================
        $wr =  New-Object -TypeName Microsoft.Xrm.Sdk.Entity -ArgumentList "webresource"
        $wr["name"] = $webResourceName;
        $wr["displayname"] = $webResourceName;
        $wr["content"] = $webResourceContentB64;

		$extension = [System.IO.Path]::GetExtension($webResourcePath);

        switch ($extension.ToLower())
        {
            ".htm"  { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 1; }
            ".html" { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 1; }
            ".css"  { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 2; }
            ".js"   { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 3; }
            ".xml"  { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 4; }
            ".png"  { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 5; }
            ".jpg"  { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 6; }
            ".jpeg" { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 6; }
            ".gif"  { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 7; }
            ".xap"  { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 8; }
            ".xsl"  { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 9; }
            ".ico"  { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 10;}
            default { $wr["webresourcetype"] = New-Object -TypeName Microsoft.Xrm.Sdk.OptionSetValue -ArgumentList 4; }
        }
        $wr["webresourcetype"] = [Microsoft.Xrm.Sdk.OptionSetValue]$wr["webresourcetype"]; 

        try
        {
            $id = $service.Create($wr);
            $publishXmlRequest += [string]::Concat("<webresource>", $id, "</webresource>"); 
            Write-Host "Done!" -ForegroundColor Green -NoNewline;            
            $publish = $true;
        }
        catch [Exception]
        {                
            Write-Host "Failed! [Error : $_.Exception]" -ForegroundColor Red;
            continue;
        }
        
        
        # =======================================================
        # Add webresource to CRM Solution
        # =======================================================
        $solutionName = $config.Configuration.SolutionName;
        Write-Host " => Add to solution '$solutionName'..." -NoNewline;

        $request = New-Object -TypeName Microsoft.Crm.Sdk.Messages.AddSolutionComponentRequest;
        $request.AddRequiredComponents = $false;
        $request.ComponentType = 61;
        $request.ComponentId = $id;
        $request.SolutionUniqueName = $solutionName;
        try
        {
            $response = $service.Execute($request);
            
        }
        catch [Exception]
        {                
            Write-Host "Failed! [Error : $_.Exception]" -ForegroundColor Red;
            continue;
        }            
        Write-Host "Done!" -ForegroundColor Green;
        
        #endregion Webresource creation
    }
    else
    {
        #region Webresource update

        # =======================================================
        # Update webresource if content is different
        # =======================================================
        $crmWebResourceContent = $webresource.Attributes["content"].ToString();
        if($crmWebResourceContent -ne $webResourceContentB64)
        {
            $webresource["content"] = $webResourceContentB64;
            try
            {
                $service.Update($webresource);
                $publishXmlRequest += [string]::Concat("<webresource>", $webresource.Id, "</webresource>");
                $publish = $true;
                Write-Host "updated!" -ForegroundColor Green;
            }
            catch [Exception]
            {                
                Write-Host "update failed! [Error : $_.Exception]" -ForegroundColor Red;
                continue;
            }
        }
        else
        {
            Write-Host "ignored!" -ForegroundColor Gray;
        }
        #endregion Webresource update
    }    
}
write-progress one one -completed;

# =======================================================
# Publish modifications if necessary
# =======================================================
 if($publish)
{	
	$d = Get-Date;
	Write-Host "$d - Publish start" -ForegroundColor Cyan;
	$publishXmlRequest += "</webresources></importexportxml>";

	$publishRequest = New-Object -TypeName Microsoft.Crm.Sdk.Messages.PublishXmlRequest;
	$publishRequest.ParameterXml = $publishXmlRequest;
	$publishResponse = $service.Execute($publishRequest);

	$d = Get-Date;
	Write-Host "$d - Publish stop" -ForegroundColor Cyan;
}

$d = Get-Date;
Write-Host "$d - Deploy WebResources stop" -ForegroundColor Cyan;