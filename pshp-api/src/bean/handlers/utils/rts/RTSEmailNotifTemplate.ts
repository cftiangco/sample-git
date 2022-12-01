
export class RTSEmailNotifTemplate {
	public static getString() {
		return {
			html:
				`
Dear AML team, <br /><br / >

Please be informed that below PRUShoppe client({{oir}}) has been tagged as {{rtsMaxScoreOnList}}. <br/><br/>

<table style="border: 0px;">
    <tr>
        <th>ReferenceID: </th><td>{{rtsId}}</td>
    </tr>
    <tr>
        <th>Salutation: </th><td>{{salutation}}</td>
    </tr>
    <tr>
        <th>Firstname:  </th><td>{{firstname}} </td>
    </tr>
    <tr>
        <th>Middlename: </th><td>{{middlename}}</td>
    </tr>
    <tr>
        <th>Lastname:   </th><td>{{lastname}}  </td>
    </tr>    
    <tr>
        <th>Birthday:   </th><td>{{birthday}}  </td>
    </tr>
    <tr>
        <th>Location:   </th><td>{{location}}  </td>
    </tr>
</table>

<br/>
This is a system generated email. Please do not reply.
`
		}		
	}
}