# Universal Xrm Settings

The universal Xrm settings page was built to support a simple webpage that would allow for a better configuration experience. The scripts are based on the Web API introduced in CRM 2016.

The page requires the existance of a "configuration entity" which has one field with a unique key and a corresponding value.

## Setup

This solution comes with a configuration in JSON format. This can be adjusted in the Content/data/settings.js file.

### Entity definition

The following section is the entity definition.

```JavaScript
entityDefinition: {
    entityName: "mns_settings", // The entity logical name
    id: "mns_settingid", // The logical name of the ID field
    key: "mns_key", // The logical name of the "key" field
    value: "mns_value" // The logical name of the value field
}
```
### Behaviours

The following section describes the configurable behaviours for this settings page.

```JavaScript
behaviour: {
    allowCreate: true // Allow the records to be created if the key does not exist
}
```

### Setting Fields

The following section describes how the fields are defined. The fields are shown with the name as the label, the key corresponds with the key in the setting record.

```JavaScript
settingSet: [
    {
        key: "key1",
        name: "First Key",
        description: "The very first key"
    },
    {
        key: "key2",
        name: "Second Key",
        description: "The second key"
    }
    // Add more
]
```

## Deployment 

Since this page is meant to be part of a custom solution/setup the deployment can be done to an existing (or new) custom unmanaged solution. The deployment contains two files:

* deploy.ps1 - The deployment Powershell script
* config.xml - The deployment configuration XML file

Change the configuration file. Add a CRM connection string as per the [simple configuration example on MSDN](https://msdn.microsoft.com/en-us/library/jj602970.aspx).

The solution name and the prefix can be changed as needed.

Do not remove any of the webresource files, all are required unless you make other modifications.

```XML
<Configuration>
  <CrmConnectionString>CRM CONNECTION STRING</CrmConnectionString>
  <SolutionName>My Custom Solution</SolutionName>
  <SolutionPrefix>new_</SolutionPrefix>
  <WebResourceFiles basePath ="\..\">
    <WebResourceFile file="settings.html" path="settings/settings.html" />
    <WebResourceFile file="Content\styles\page.css" path="settings/Content/styles/page.css" />
    <WebResourceFile file="Content\data\settings.js" path="settings/Content/data/settings.js" />
    <WebResourceFile file="Scripts\jquery.js" path="settings/Scripts/jquery.js" />
    <WebResourceFile file="Scripts\page.js" path="settings/Scripts/page.js" />
    <WebResourceFile file="Content\fonts\glyphicons-halflings-regular.eot" path="settings/Content/fonts/glyphiconshalflingsregular.eot" />
    <WebResourceFile file="Content\fonts\glyphicons-halflings-regular.svg" path="settings/Content/fonts/glyphiconshalflingsregular.svg" />
    <WebResourceFile file="Content\fonts\glyphicons-halflings-regular.ttf" path="settings/Content/fonts/glyphiconshalflingsregular.ttf" />
    <WebResourceFile file="Content\fonts\glyphicons-halflings-regular.woff" path="settings/Content/fonts/glyphiconshalflingsregular.woff" />
    <WebResourceFile file="Content\fonts\glyphicons-halflings-regular.woff2" path="settings/Content/fonts/glyphiconshalflingsregular.woff2" />
  </WebResourceFiles>
</Configuration>
```

## Disclaimer

The deployment script is based heavily on Aymeric's [synchronize CRM webresources folder script](https://blogs.msdn.microsoft.com/aymerics_blog/2015/06/06/synchronize-a-webresources-folder-to-crm-with-powershell/).

This solution comes bundled with bootstrap and jQuery (installed through NuGet), all relevant licenses apply.
