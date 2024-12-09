import { MethodType } from './MethodType'

export default class HttpRequestParameters {
    method_type: MethodType = MethodType.GET
    url: string = ''
    headers: Array<{ key: string; value: string }> = []
    query_parameters: Array<{ key: string; value: string }> = []
    body: string = ''
    timeout: number = 0
    trust_any_certificate: boolean = false
    follow_redirects: boolean = false
    use_cookies: boolean = false
    structure_output: boolean = false
}
