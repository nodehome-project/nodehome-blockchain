#!/bin/bash

show_error() {
    echo "Error: $1." >&2
    echo "See --help for usage and options." >&2
}

parse_documentation() {
    documentation="$(grep "^##" "$0")(no-trim)"
    documentation=$(echo "$documentation" | sed -r "s/## ?//" | sed -r "s/@script.name/$(basename "$0")/g" | sed "s/@#/@/g")
    documentation=${documentation%(no-trim)}
}

parse_options() {

    local short_option_vars
    local short_options
    local documentation
    local next_is_value
    local argument

    local option
    local option_name
    local option_value
    local option_var

    local known_option
    local known_option_name
    local known_option_var

    # Parse known options from documentation
    if [[ -z ${options+defined} ]]; then
        parse_documentation
        while read -r line; do
            case "$line" in
                "-h, --help"*)  continue ;;
                "--help, -h"*)  continue ;;
                -*," "--*)      option=$(echo "$line" | awk -F'(^-|, --| )'  '{ print $2"="$3 }') ;;
                --*," "-*)      option=$(echo "$line" | awk -F'(--|, -| )'   '{ print $3"="$2 }') ;;
                --*=*)          option=$(echo "$line" | awk -F'(--|=| )'     '{ print $2"=?" }') ;;
                --*" "*)        option=$(echo "$line" | awk -F'(--| )'       '{ print $2 }') ;;
                *)              continue ;;
            esac
            options+=("$option")
        done <<< "$documentation"
    fi

    options+=(h=help)
    arguments=()

    # Prepare known options
    for option in "${options[@]}"; do
        option_var=${option#*=}
        option_name=${option%=$option_var}
        if [[ "${#option_name}" = "1" ]]; then
            short_options="${short_options}${option_name}"
            if [[ "${#option_var}" > "1" ]]; then
                short_option_vars+=("$option_var")
            fi
        fi
    done

    # Extract regular arguments
    index=1
    parameters=()
    for argument in "$@"; do
        if [[ "$argument" = -* ]]; then
            parameters+=("$argument")
            for known_option in "${options[@]}"; do
                known_option_var=${known_option#*=}
                known_option_name=${known_option%=$known_option_var}
                if [[ "$known_option_var" = "?" && "$argument" = --$known_option_name ]]; then
                    next_is_value="yes"
                    break
                fi
            done
        else
            if [[ -z "$next_is_value" ]]; then
                arguments+=("${!index}")
            else
                parameters+=("$argument")
            fi
            next_is_value=""
        fi
        index=$((index + 1))
    done
    set -- "${parameters[@]}"

    # Parse the provided options
    while getopts ":${short_options}-:" option; do
        option="${option}${OPTARG}"
        option_value=""

        # Set the corresponding variable for known options
        for known_option in "${options[@]}" "${short_option_vars[@]}"; do
            known_option_var=${known_option#*=}
            known_option_name=${known_option%=$known_option_var}

            # Short option
            if [[ "$option" = "$known_option_name" ]]; then
                option_value="yes"
                known_option_var=$(echo "$known_option_var" | tr "-" "_")
                eval "$known_option_var=\"$option_value\""
                break

            # Long option
            elif [[ "$option" = -$known_option_name && "$known_option_var" != "?" ]]; then
                option_value="yes"
                known_option_var=$(echo "$known_option_var" | tr "-" "_")
                eval "$known_option_var=\"$option_value\""
                break

            # Long option with value in next parameter
            elif [[ "$option" = -$known_option_name && "$known_option_var" = "?" ]]; then
                eval option_value="\$$OPTIND"
                if [[ -z "$option_value" || "$option_value" = -* ]]; then
                    show_error "you must specify a value for --$known_option_name"
                    exit 1
                fi
                OPTIND=$((OPTIND + 1))
                known_option_var=$(echo "$known_option_name" | tr "-" "_")
                eval "$known_option_var=\"$option_value\""
                break

            # Long option with value after equal sign
            elif [[ "$option" = -$known_option_name=* && "$known_option_var" = "?" ]]; then
                option_value=${option#*=}
                known_option_var=$(echo "$known_option_name" | tr "-" "_")
                eval "$known_option_var=\"$option_value\""
                break

            # Long option with unnecessary value
            elif [[ "$option" = -$known_option_name=* && "$known_option_var" != "?" ]]; then
                option_value=${option#*=}
                show_error "--$known_option_name does not accept a value, you specified \"$option_value\""
                exit 1
            fi
        done

        # Unknown option
        if [[ -z "$option_value" ]]; then
            option=${option%%=*}
            [[ "$option" = \?* ]] && option=${option#*\?}
            show_error "unrecognized option -$option"
            exit 1
        fi

        # Help option
        if [[ -n "$help" ]]; then
            [[ -z "$documentation" ]] && parse_documentation
            echo "$documentation"
            exit
        fi
    done
}

